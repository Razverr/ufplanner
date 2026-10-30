import express from 'express';
import { pool, isDbConnected } from '../db/pool.js';
import { VERIFIED_COURSES } from '../db/seed.js';
import { evaluatePrerequisites, parseRawPrerequisites } from '../utils/prereqs.js';

export const coursesRouter = express.Router();

/**
 * Helper to build course object for client
 */
function formatCourseForClient(dbRow, offeringsMap, reqMappingsMap) {
  const courseId = dbRow.id;
  const rawPrereqs = dbRow.raw_prerequisites || '';
  const parsedPrereqs = dbRow.prereq_rules && typeof dbRow.prereq_rules === 'object' && Object.keys(dbRow.prereq_rules).length > 0
    ? dbRow.prereq_rules
    : parseRawPrerequisites(rawPrereqs);

  const requirementIds = [...new Set((reqMappingsMap[courseId] || []).map(r => r.requirement_id).filter(Boolean))];
  const requirementExplanations = {};
  for (const m of (reqMappingsMap[courseId] || [])) {
    requirementExplanations[m.requirement_id] = m.explanation;
  }

  // Flatten courseCodes into legacy prerequisites array for backwards compatibility
  const legacyPrereqs = (parsedPrereqs.courseCodes || []).map(code => 
    code.toLowerCase().replace(/\s+/g, '-')
  );

  return {
    id: courseId,
    code: dbRow.code,
    courseId: dbRow.course_id,
    title: dbRow.title,
    credits: Number(dbRow.credits_min || 3),
    credits_min: Number(dbRow.credits_min || 3),
    credits_max: Number(dbRow.credits_max || 3),
    credits_display: dbRow.credits_display || String(dbRow.credits_min || 3),
    description: dbRow.description || '',
    raw_prerequisites: rawPrereqs,
    prereq_rules: parsedPrereqs,
    prerequisites: legacyPrereqs,
    requirementIds,
    requirementExplanations,
    offerings: offeringsMap[courseId] || {},
    source_timestamp: dbRow.source_timestamp,
    dept_name: dbRow.dept_name,
    // Academic status will be derived on client from student's history & plan
    academicStatus: 'not-planned',
    plannedSemester: null
  };
}

/**
 * GET /api/courses
 * Filter by query search (q), requirement ID, and destination semester
 */
coursesRouter.get('/', async (req, res) => {
  const { q, requirement, semester } = req.query;

  try {
    // If database is connected, query PostgreSQL
    if (isDbConnected()) {
      let query = `
        SELECT c.*, 
          COALESCE(
            json_object_agg(co.term_id, co.offering_status) FILTER (WHERE co.term_id IS NOT NULL),
            '{}'::json
          ) as offerings_json,
          COALESCE(
            json_agg(
              json_build_object(
                'requirement_id', crm.requirement_id,
                'explanation', crm.explanation
              )
            ) FILTER (WHERE crm.requirement_id IS NOT NULL),
            '[]'::json
          ) as requirements_json
        FROM courses c
        LEFT JOIN course_offerings co ON c.id = co.course_id
        LEFT JOIN course_requirement_mappings crm ON c.id = crm.course_id
        WHERE 1=1
      `;
      const params = [];

      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        query += ` AND (c.code ILIKE $${params.length} OR c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
      }

      if (requirement && requirement.trim()) {
        params.push(requirement.trim());
        query += ` AND EXISTS (
          SELECT 1 FROM course_requirement_mappings m 
          WHERE m.course_id = c.id AND m.requirement_id = $${params.length}
        )`;
      }

      query += ` GROUP BY c.id ORDER BY c.code ASC`;

      const result = await pool.query(query, params);

      const formatted = result.rows.map(row => {
        const rawPrereqs = row.raw_prerequisites || '';
        const parsedPrereqs = row.prereq_rules && typeof row.prereq_rules === 'object' && Object.keys(row.prereq_rules).length > 0
          ? row.prereq_rules
          : parseRawPrerequisites(rawPrereqs);

        const reqs = Array.isArray(row.requirements_json) ? row.requirements_json : [];
        const requirementIds = [...new Set(reqs.map(r => r.requirement_id).filter(Boolean))];
        const requirementExplanations = {};
        for (const r of reqs) {
          if (r.requirement_id) requirementExplanations[r.requirement_id] = r.explanation;
        }

        const legacyPrereqs = (parsedPrereqs.courseCodes || []).map(code =>
          code.toLowerCase().replace(/\s+/g, '-')
        );

        return {
          id: row.id,
          code: row.code,
          courseId: row.course_id,
          title: row.title,
          credits: Number(row.credits_min || 3),
          credits_min: Number(row.credits_min || 3),
          credits_max: Number(row.credits_max || 3),
          credits_display: row.credits_display || String(row.credits_min || 3),
          description: row.description || '',
          raw_prerequisites: rawPrereqs,
          prereq_rules: parsedPrereqs,
          prerequisites: legacyPrereqs,
          requirementIds,
          requirementExplanations,
          offerings: row.offerings_json || {},
          source_timestamp: row.source_timestamp,
          dept_name: row.dept_name,
          academicStatus: 'not-planned',
          plannedSemester: null
        };
      });

      return res.json({
        source: 'PostgreSQL Database (ONE.UF SOC & Catalog)',
        count: formatted.length,
        courses: formatted
      });
    }

    // Fallback mode: Verified in-memory catalog data if database not yet migrated
    let filtered = VERIFIED_COURSES.map(c => {
      const parsedPrereqs = parseRawPrerequisites(c.raw_prerequisites);
      const legacyPrereqs = (parsedPrereqs.courseCodes || []).map(code =>
        code.toLowerCase().replace(/\s+/g, '-')
      );

      return {
        id: c.id,
        code: c.code,
        courseId: null,
        title: c.title,
        credits: c.credits_min,
        credits_min: c.credits_min,
        credits_max: c.credits_max,
        credits_display: c.credits_display,
        description: c.description,
        raw_prerequisites: c.raw_prerequisites,
        prereq_rules: parsedPrereqs,
        prerequisites: legacyPrereqs,
        requirementIds: c.requirementIds,
        requirementExplanations: { [c.requirementIds[0]]: c.explanation },
        offerings: c.offerings,
        source_timestamp: new Date().toISOString(),
        dept_name: 'Computer & Information Science & Engineering',
        academicStatus: 'not-planned',
        plannedSemester: null
      };
    });

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(term) ||
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      );
    }

    if (requirement && requirement.trim()) {
      filtered = filtered.filter(c => c.requirementIds.includes(requirement.trim()));
    }

    return res.json({
      source: 'UF Verified Academic Catalog 2026-2027 (Pre-seeded Fallback)',
      count: filtered.length,
      courses: filtered
    });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to retrieve course data', details: err.message });
  }
});

/**
 * POST /api/courses/evaluate-prereq
 * Evaluate a course's prerequisites against student history & plan
 */
coursesRouter.post('/evaluate-prereq', (req, res) => {
  const { rawPrerequisites, destinationSemesterId, studentCourses, semesters } = req.body;

  if (!destinationSemesterId || !Array.isArray(studentCourses) || !Array.isArray(semesters)) {
    return res.status(400).json({
      error: 'Missing required parameters: destinationSemesterId, studentCourses, semesters'
    });
  }

  const parsed = parseRawPrerequisites(rawPrerequisites);
  const result = evaluatePrerequisites(parsed, destinationSemesterId, studentCourses, semesters);

  return res.json(result);
});
