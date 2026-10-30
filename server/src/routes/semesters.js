import express from 'express';
import { pool, isDbConnected } from '../db/pool.js';

export const semestersRouter = express.Router();

const DEFAULT_SEMESTERS = [
  { id: 'fall-2025', code: '2258', label: 'Fall 2025', season: 'Fall', year: 2025 },
  { id: 'spring-2026', code: '2261', label: 'Spring 2026', season: 'Spring', year: 2026 },
  { id: 'summer-2026', code: '2265', label: 'Summer 2026', season: 'Summer', year: 2026 },
  { id: 'fall-2026', code: '2268', label: 'Fall 2026', season: 'Fall', year: 2026 }
];

semestersRouter.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await pool.query(`
        SELECT id, code, label, season, year, sort_term, is_active
        FROM terms
        WHERE is_active = TRUE
        ORDER BY sort_term ASC
      `);
      if (result.rows.length > 0) {
        return res.json({ semesters: result.rows });
      }
    }
    return res.json({ semesters: DEFAULT_SEMESTERS });
  } catch (err) {
    console.error('Error in /api/semesters:', err);
    return res.json({ semesters: DEFAULT_SEMESTERS });
  }
});
