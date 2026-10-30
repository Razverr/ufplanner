import express from 'express';
import { pool, isDbConnected } from '../db/pool.js';
import { VERIFIED_PROGRAM, VERIFIED_REQUIREMENTS } from '../db/seed.js';

export const requirementsRouter = express.Router();

requirementsRouter.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const progRes = await pool.query(`SELECT * FROM degree_programs LIMIT 1`);
      const reqsRes = await pool.query(`
        SELECT id, name, description, required_credits as "totalCredits", category_order, next_course_suggestion as "nextCourse"
        FROM degree_requirements
        ORDER BY category_order ASC
      `);

      if (reqsRes.rows.length > 0) {
        const requirements = reqsRes.rows.map(r => ({
          ...r,
          completedCredits: 0,
          plannedCredits: 0,
          creditNotes: r.id === 'critical-tracking'
            ? ['AP Calculus AB applied as MAC 2311']
            : r.id === 'general-education'
              ? ['Dual-enrollment ENC 1101 applied to Composition']
              : []
        }));

        return res.json({
          program: progRes.rows[0] || VERIFIED_PROGRAM,
          requirements
        });
      }
    }

    // Default verified response
    const requirements = VERIFIED_REQUIREMENTS.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      totalCredits: r.required_credits,
      completedCredits: 0,
      plannedCredits: 0,
      creditNotes: r.id === 'critical-tracking'
        ? ['AP Calculus AB applied as MAC 2311']
        : r.id === 'general-education'
          ? ['Dual-enrollment ENC 1101 applied to Composition']
          : [],
      nextCourse: r.next_course_suggestion
    }));

    return res.json({
      program: VERIFIED_PROGRAM,
      requirements
    });
  } catch (err) {
    console.error('Error in /api/requirements:', err);
    res.status(500).json({ error: 'Failed to load degree requirements' });
  }
});
