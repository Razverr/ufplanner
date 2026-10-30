import express from 'express';
import { runImport, DEFAULT_IMPORT_SCOPE } from '../importer/oneuf-importer.js';
import { isDbConnected } from '../db/pool.js';

export const importRouter = express.Router();

importRouter.post('/', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      error: 'Database is not connected. Please ensure PostgreSQL is running and credentials are configured.'
    });
  }

  const customScope = {
    ...DEFAULT_IMPORT_SCOPE,
    ...req.body
  };

  try {
    const result = await runImport(customScope);
    res.json({
      message: 'Import completed successfully',
      result
    });
  } catch (err) {
    res.status(500).json({
      error: 'Import failed',
      details: err.message
    });
  }
});
