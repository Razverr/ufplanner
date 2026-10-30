import express from 'express';
import { pool, isDbConnected } from '../db/pool.js';

export const metaRouter = express.Router();

metaRouter.get('/', async (req, res) => {
  try {
    let lastImport = null;
    let totalCourses = 0;
    let totalOfferings = 0;

    if (isDbConnected()) {
      try {
        const importRes = await pool.query(`
          SELECT * FROM import_logs
          WHERE status = 'completed'
          ORDER BY completed_at DESC
          LIMIT 1
        `);
        lastImport = importRes.rows[0] || null;

        const countRes = await pool.query(`SELECT COUNT(*) FROM courses`);
        totalCourses = parseInt(countRes.rows[0]?.count || 0, 10);

        const offRes = await pool.query(`SELECT COUNT(*) FROM course_offerings`);
        totalOfferings = parseInt(offRes.rows[0]?.count || 0, 10);
      } catch (e) {
        // Log tables might not exist yet if unmigrated
      }
    }

    return res.json({
      sources: [
        {
          name: 'ONE.UF Schedule of Courses API',
          endpoint: 'https://one.uf.edu/apix/soc/schedule',
          purpose: 'Live class sections, confirmed semester offerings, instructors, and open seat data'
        },
        {
          name: 'UF Undergraduate Academic Catalog',
          url: 'https://catalog.ufl.edu/UGRD/colleges-schools/UGENG/CPS_BSCS/',
          purpose: 'Official degree requirements, program tracking, and course descriptions'
        }
      ],
      program: {
        degree: 'Computer Science, B.S.',
        college: 'Herbert Wertheim College of Engineering',
        catalogYear: '2026-2027'
      },
      database: {
        connected: isDbConnected(),
        totalCoursesInDb: totalCourses,
        totalOfferingsInDb: totalOfferings,
        lastImportCompleted: lastImport ? lastImport.completed_at : null
      },
      offeringDefinitions: {
        available: 'Course has confirmed active sections scheduled in ONE.UF for this term. (Does not guarantee seat registration availability).',
        predicted: 'Course has a consistent historical offering pattern for this term season, but the schedule has not been officially published.',
        unknown: 'No schedule or predictable pattern found for this semester.'
      },
      disclaimer: 'This planner integrates public University of Florida schedule and catalog data for degree planning purposes. Prerequisites and degree audits must be verified with your academic advisor before registration.'
    });
  } catch (err) {
    console.error('Error in /api/meta:', err);
    res.status(500).json({ error: 'Failed to retrieve metadata' });
  }
});
