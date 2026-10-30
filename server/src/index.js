import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db/pool.js';
import { coursesRouter } from './routes/courses.js';
import { semestersRouter } from './routes/semesters.js';
import { requirementsRouter } from './routes/requirements.js';
import { metaRouter } from './routes/meta.js';
import { importRouter } from './routes/import.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/courses', coursesRouter);
app.use('/api/semesters', semestersRouter);
app.use('/api/requirements', requirementsRouter);
app.use('/api/meta', metaRouter);
app.use('/api/import', importRouter);

app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🐊 UF Planner PERN Backend Server running on port ${PORT}`);
  console.log(`   Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`======================================================`);

  const dbStatus = await testConnection();
  if (dbStatus.ok) {
    console.log(`✅ PostgreSQL connection active at ${dbStatus.timestamp}`);
  } else {
    console.warn(`⚠️ PostgreSQL is not connected: ${dbStatus.error}`);
    console.warn(`👉 The server is operating with verified UF Catalog data fallback.`);
    console.warn(`👉 To connect PostgreSQL, set credentials in server/.env and run 'npm run db:migrate'.`);
  }
});
