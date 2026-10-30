/**
 * UF Planner API Client
 * Connects frontend to Express PERN backend with resilient fallbacks.
 */

const API_BASE = '/api';

export async function fetchCoursesFromApi(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.requirement) query.set('requirement', params.requirement);
  if (params.semester) query.set('semester', params.semester);

  const res = await fetch(`${API_BASE}/courses?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load courses from API (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function fetchSemestersFromApi() {
  const res = await fetch(`${API_BASE}/semesters`);
  if (!res.ok) {
    throw new Error(`Failed to load semesters (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function fetchRequirementsFromApi() {
  const res = await fetch(`${API_BASE}/requirements`);
  if (!res.ok) {
    throw new Error(`Failed to load degree requirements (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function fetchMetaFromApi() {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) {
    throw new Error(`Failed to load source metadata (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function evaluatePrerequisiteApi(payload) {
  const res = await fetch(`${API_BASE}/courses/evaluate-prereq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to evaluate prerequisites (HTTP ${res.status})`);
  }
  return await res.json();
}
