# UF Planner server

The Express server provides course search, semester metadata, prerequisite checks,
and a normalized degree-audit API backed by PostgreSQL/Neon.

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` or
   `DATABASE_URL_POOLED`.
2. Install dependencies with `npm install`.
3. Run `npm run db:migrate` and then `npm run db:seed`.
4. Start the API with `npm run dev`.
5. Start the Vite client separately from `../client` with `npm run dev`.

The Vite development server proxies `/api` requests to
`http://localhost:5000`.

## Degree-audit MVP

`GET /api/degree-audit/demo-student` returns the seeded demo audit. The response
contains the student program, completed/planned requirement totals, AP and
dual-enrollment notes, and normalized course statuses used by the three panels.

`POST /api/degree-audit/:studentId/import` replaces that student's current audit
with a validated JSON import. A sample request body is available at
`examples/demo-degree-audit.json`. In production, set `AUDIT_IMPORT_TOKEN` and
send the same value in the `x-audit-import-token` header.

For the classroom MVP, students use the **Import audit PDF** button in the web
app. `POST /api/degree-audit/:studentId/parse-pdf` extracts course candidates
from a PDF printed from ONE.UF. The student reviews those candidates before the
client sends a normalized import and refreshes the requirements and semester
plan from the response.

This endpoint is deliberately an import boundary instead of claiming direct
access to UF's protected student records. A future authenticated adapter can
translate an approved UF export into the same JSON shape without changing the
planner UI or database model.

Run `npm test` to verify validation and progress calculations.
