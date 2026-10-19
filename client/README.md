# UF Planner

UF Planner is a React prototype that helps students understand degree requirements, track academic progress, and connect unmet requirements with courses that can satisfy them.

This version includes the Requirements and Progress panel. It uses illustrative degree-audit data for the classroom demo; it is not connected to a student's official UF record.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

From the `client` directory:

```bash
npm install
npm run dev
```

Vite will print the local development URL, usually `http://localhost:5173`.

## Quality checks

```bash
npm run lint
npm run build
```

The production build is written to `client/dist`.

## Current demo behavior

- Summarizes completed, planned, and remaining credits.
- Uses visible labels and icons for each requirement status.
- Explains degree-audit categories in plain language.
- Shows how AP and dual-enrollment credit was applied.
- Recommends a possible next course for each category.
- Lets the student select a requirement and updates the Course Discovery preview.

## Relevant files

- `src/components/Requirements.jsx`: requirement calculations and interactions.
- `src/components/Requirements.css`: panel and card styling.
- `src/data/mockdata.js`: illustrative course and degree-requirement data.
- `src/App.jsx`: local integration between the requirement selection and Course Discovery preview.
- `src/App.css` and `src/index.css`: page layout and shared visual tokens.

## Integrating the three panels

`App.jsx` owns the selected requirement ID and passes it into `Requirements`. The Course Discovery component can use that same value to filter courses. The Semester Planner can later update the planned-course data, which will allow the requirement totals and statuses to update automatically.
