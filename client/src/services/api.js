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

export async function fetchDegreeAuditFromApi(studentId = 'demo-student') {
  const safeStudentId = encodeURIComponent(studentId)
  const res = await fetch(`${API_BASE}/degree-audit/${safeStudentId}`)
  if (!res.ok) {
    throw new Error(`Failed to load degree audit (HTTP ${res.status})`)
  }
  return await res.json()
}

export async function parseDegreeAuditPdfFromApi(file, studentId = 'demo-student') {
  const safeStudentId = encodeURIComponent(studentId)
  const formData = new FormData()
  formData.append('auditPdf', file)

  const res = await fetch(`${API_BASE}/degree-audit/${safeStudentId}/parse-pdf`, {
    method: 'POST',
    body: formData,
  })
  const response = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(response.error || `Failed to read degree-audit PDF (HTTP ${res.status})`)
  }
  return response
}

export async function importDegreeAuditFromApi(auditData) {
  const studentId = auditData?.student?.id
  if (!studentId) {
    throw new Error('The degree-audit file is missing a student ID.')
  }

  const safeStudentId = encodeURIComponent(studentId)
  const res = await fetch(`${API_BASE}/degree-audit/${safeStudentId}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auditData),
  })

  const response = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(response.error || `Failed to import degree audit (HTTP ${res.status})`)
  }
  return response
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
