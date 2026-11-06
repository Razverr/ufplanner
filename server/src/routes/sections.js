// Zachary Allarey Code Section
// GET /api/sections/:courseId?term=fall-2026
// returns a course's sections with meeting times for the weekly schedule

import express from 'express';
import { pool, isDbConnected } from '../db/pool.js';
import { getDemoSections } from '../data/demo-sections.js';

export const sectionsRouter = express.Router();

sectionsRouter.get('/:courseId', async (req, res) => {
  const courseId = String(req.params.courseId || '').toLowerCase();
  const termId = String(req.query.term || '');

  try {
    if (isDbConnected() && termId) {
      const result = await pool.query(
        `SELECT sections_data FROM course_offerings WHERE course_id = $1 AND term_id = $2`,
        [courseId, termId]
      );
      const sections = result.rows[0]?.sections_data || [];
      // only use db sections if they were imported with meeting times
      if (sections.some((s) => Array.isArray(s.meetTimes))) {
        return res.json({ source: 'oneuf', sections });
      }
    }
  } catch (err) {
    console.error('Error in /api/sections:', err.message);
  }

  // fallback: sample times so the demo still works
  return res.json({ source: 'demo', sections: getDemoSections(courseId) });
});