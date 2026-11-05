import express from 'express';
import multer from 'multer';
import { pool, isDbConnected } from '../db/pool.js';
import { VERIFIED_PROGRAM, VERIFIED_REQUIREMENTS } from '../db/seed.js';
import { DEMO_AUDIT_IMPORT, DEMO_STUDENT_ID } from '../data/demo-audit.js';
import {
  buildAuditResponse,
  courseCodeToId,
  validateAuditImport,
} from '../services/degree-audit.js';
import { extractDegreeAuditPdf } from '../services/degree-audit-pdf.js';

export const degreeAuditRouter = express.Router();
const uploadAuditPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

function receiveAuditPdf(req, res, next) {
  uploadAuditPdf.single('auditPdf')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'The degree-audit PDF must be smaller than 10 MB.' });
    }
    return res.status(400).json({ error: 'The degree-audit PDF could not be uploaded.' });
  });
}

function authorizeAuditImport(req, res, next) {
  const configuredToken = process.env.AUDIT_IMPORT_TOKEN;
  if (!configuredToken) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Degree-audit imports are disabled until an import token is configured.',
      });
    }
    return next();
  }

  if (req.get('x-audit-import-token') !== configuredToken) {
    return res.status(401).json({ error: 'A valid audit import token is required.' });
  }
  return next();
}

function fallbackDemoAudit() {
  const normalized = validateAuditImport(DEMO_AUDIT_IMPORT, DEMO_STUDENT_ID);
  return buildAuditResponse({
    student: normalized.student,
    program: VERIFIED_PROGRAM,
    requirements: VERIFIED_REQUIREMENTS,
    courses: normalized.courses,
    source: 'verified-demo-fallback',
  });
}

async function loadAuditFromDatabase(studentId, client = pool) {
  const studentResult = await client.query(
    `SELECT sp.id, sp.display_name, sp.catalog_year,
            dp.id AS program_id, dp.name, dp.college, dp.total_credits
       FROM student_profiles sp
       JOIN degree_programs dp ON dp.id = sp.program_id
      WHERE sp.id = $1`,
    [studentId],
  );
  if (studentResult.rows.length === 0) return null;

  const requirementResult = await client.query(
    `SELECT dr.id, dr.name, dr.description, dr.required_credits,
            dr.category_order, dr.next_course_suggestion
       FROM degree_requirements dr
      WHERE dr.program_id = $1
      ORDER BY dr.category_order ASC`,
    [studentResult.rows[0].program_id],
  );
  const courseResult = await client.query(
    `SELECT scr.id, scr.course_id, scr.course_code, scr.title, scr.credits,
            scr.status, scr.source_type, scr.term_label,
            scr.planned_semester_id, scr.grade, scr.note,
            scra.requirement_id, scra.applied_credits
       FROM student_course_records scr
       LEFT JOIN student_course_requirement_applications scra
         ON scra.student_course_id = scr.id
      WHERE scr.student_id = $1
      ORDER BY scr.course_code, scra.requirement_id`,
    [studentId],
  );
  const importResult = await client.query(
    `SELECT source, imported_at
       FROM degree_audit_imports
      WHERE student_id = $1
      ORDER BY imported_at DESC
      LIMIT 1`,
    [studentId],
  );

  const coursesById = new Map();
  for (const row of courseResult.rows) {
    if (!coursesById.has(row.id)) {
      coursesById.set(row.id, {
        courseId: row.course_id || courseCodeToId(row.course_code),
        code: row.course_code,
        title: row.title,
        credits: Number(row.credits),
        status: row.status,
        sourceType: row.source_type,
        termLabel: row.term_label,
        plannedSemesterId: row.planned_semester_id,
        grade: row.grade,
        note: row.note,
        requirementApplications: [],
      });
    }
    if (row.requirement_id) {
      coursesById.get(row.id).requirementApplications.push({
        requirementId: row.requirement_id,
        credits: Number(row.applied_credits),
      });
    }
  }

  const row = studentResult.rows[0];
  const latestImport = importResult.rows[0];
  return buildAuditResponse({
    student: { id: row.id, displayName: row.display_name },
    program: {
      id: row.program_id,
      name: row.name,
      college: row.college,
      catalog_year: row.catalog_year,
      total_credits: row.total_credits,
    },
    requirements: requirementResult.rows,
    courses: [...coursesById.values()],
    source: latestImport?.source || 'database',
    importedAt: latestImport?.imported_at || null,
  });
}

degreeAuditRouter.get('/:studentId', async (req, res) => {
  const studentId = String(req.params.studentId || '').trim().toLowerCase();
  try {
    if (isDbConnected()) {
      const audit = await loadAuditFromDatabase(studentId);
      if (audit) return res.json(audit);
    }

    if (studentId === DEMO_STUDENT_ID) {
      return res.json(fallbackDemoAudit());
    }
    return res.status(isDbConnected() ? 404 : 503).json({
      error: isDbConnected()
        ? 'No degree audit was found for this student.'
        : 'The database is unavailable. Only the demo audit can be loaded offline.',
    });
  } catch (error) {
    console.error('Error loading degree audit:', error);
    return res.status(500).json({ error: 'Failed to load the degree audit.' });
  }
});

degreeAuditRouter.post('/:studentId/parse-pdf', receiveAuditPdf, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Choose a degree-audit PDF to continue.' });
  }
  try {
    const extracted = await extractDegreeAuditPdf(req.file.buffer);
    if (extracted.candidates.length === 0) {
      return res.status(422).json({
        error: 'No UF course codes were found in this PDF. Make sure it is a ONE.UF degree audit.',
      });
    }

    const codes = extracted.candidates.map((candidate) => candidate.code);
    const catalogResult = await pool.query(
      `SELECT c.id, c.code, c.title, c.credits_min AS credits, crm.requirement_id
         FROM courses c
         LEFT JOIN course_requirement_mappings crm ON crm.course_id = c.id
        WHERE c.code = ANY($1::text[])
        ORDER BY c.code`,
      [codes],
    );
    const catalogByCode = new Map();
    for (const row of catalogResult.rows) {
      if (!catalogByCode.has(row.code)) {
        catalogByCode.set(row.code, {
          id: row.id,
          title: row.title,
          credits: Number(row.credits),
          requirementIds: [],
        });
      }
      if (row.requirement_id) {
        catalogByCode.get(row.code).requirementIds.push(row.requirement_id);
      }
    }

    const candidates = extracted.candidates.map((candidate) => {
      const catalogCourse = catalogByCode.get(candidate.code);
      const credits = catalogCourse?.credits || 3;
      return {
        ...candidate,
        title: catalogCourse?.title || 'Course title not found in catalog',
        credits,
        catalogMatch: Boolean(catalogCourse),
        requirementApplications: (catalogCourse?.requirementIds || []).map(
          (requirementId) => ({ requirementId, credits }),
        ),
      };
    });

    return res.json({
      fileName: req.file.originalname,
      pageCount: extracted.pageCount,
      studentId: String(req.params.studentId || 'demo-student').toLowerCase(),
      candidates,
      selectedCount: candidates.filter((candidate) => candidate.selected).length,
    });
  } catch (error) {
    console.error('Error parsing degree-audit PDF:', error);
    return res.status(422).json({ error: error.message || 'The PDF could not be read.' });
  }
});

degreeAuditRouter.post('/:studentId/import', authorizeAuditImport, async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      error: 'A database connection is required to import a degree audit.',
    });
  }

  let auditImport;
  try {
    auditImport = validateAuditImport(req.body, req.params.studentId);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  let client;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    const programResult = await client.query(
      'SELECT id FROM degree_programs WHERE id = $1',
      [auditImport.programId],
    );
    if (programResult.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(400).json({ error: 'The requested degree program does not exist.' });
    }

    await client.query(
      `INSERT INTO student_profiles
         (id, display_name, program_id, catalog_year, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         program_id = EXCLUDED.program_id,
         catalog_year = EXCLUDED.catalog_year,
         updated_at = NOW()`,
      [
        auditImport.student.id,
        auditImport.student.displayName,
        auditImport.programId,
        auditImport.catalogYear,
      ],
    );

    await client.query(
      'DELETE FROM student_course_records WHERE student_id = $1',
      [auditImport.student.id],
    );

    const courseCatalogResult = await client.query(
      'SELECT id, code, title FROM courses',
    );
    const catalogByCode = new Map(
      courseCatalogResult.rows.map((course) => [course.code, course]),
    );
    const requirementResult = await client.query(
      'SELECT id FROM degree_requirements WHERE program_id = $1',
      [auditImport.programId],
    );
    const validRequirementIds = new Set(
      requirementResult.rows.map((requirement) => requirement.id),
    );

    for (const course of auditImport.courses) {
      const catalogCourse = catalogByCode.get(course.code);
      const applications = [...course.requirementApplications];

      if (applications.length === 0 && catalogCourse) {
        const mappingResult = await client.query(
          `SELECT requirement_id
             FROM course_requirement_mappings
            WHERE course_id = $1`,
          [catalogCourse.id],
        );
        applications.push(
          ...mappingResult.rows.map((mapping) => ({
            requirementId: mapping.requirement_id,
            credits: course.credits,
          })),
        );
      }

      for (const application of applications) {
        if (!validRequirementIds.has(application.requirementId)) {
          throw new Error(
            `Requirement ${application.requirementId} is not part of ${auditImport.programId}.`,
          );
        }
      }

      const inserted = await client.query(
        `INSERT INTO student_course_records
           (student_id, course_id, course_code, title, credits, status,
            source_type, term_label, planned_semester_id, grade, note, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING id`,
        [
          auditImport.student.id,
          catalogCourse?.id || null,
          course.code,
          course.title || catalogCourse?.title || course.code,
          course.credits,
          course.status,
          course.sourceType,
          course.termLabel,
          course.plannedSemesterId,
          course.grade,
          course.note,
        ],
      );
      const studentCourseId = inserted.rows[0].id;

      for (const application of applications) {
        await client.query(
          `INSERT INTO student_course_requirement_applications
             (student_course_id, requirement_id, applied_credits)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_course_id, requirement_id) DO UPDATE SET
             applied_credits = EXCLUDED.applied_credits`,
          [studentCourseId, application.requirementId, application.credits],
        );
      }
    }

    await client.query(
      `INSERT INTO degree_audit_imports (student_id, source, raw_payload)
       VALUES ($1, $2, $3::jsonb)`,
      [
        auditImport.student.id,
        auditImport.source,
        JSON.stringify({
          catalogYear: auditImport.catalogYear,
          programId: auditImport.programId,
          courseCount: auditImport.courses.length,
        }),
      ],
    );

    await client.query('COMMIT');
    transactionStarted = false;
    const audit = await loadAuditFromDatabase(auditImport.student.id);
    return res.status(201).json(audit);
  } catch (error) {
    if (client && transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.error('Error importing degree audit:', error);
    return res.status(client ? 400 : 503).json({
      error: client
        ? error.message
        : 'The database connection failed before the audit could be imported.',
    });
  } finally {
    client?.release();
  }
});
