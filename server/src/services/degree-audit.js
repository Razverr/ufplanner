const VALID_STATUSES = new Set(['completed', 'in-progress', 'planned']);
const VALID_SOURCES = new Set([
  'uf',
  'ap',
  'dual-enrollment',
  'transfer',
  'manual',
]);
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

function cleanText(value, maxLength) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

export function normalizeCourseCode(value) {
  const compact = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const match = compact.match(/^([A-Z]{2,4})(\d{4}[A-Z]?)$/);
  return match ? `${match[1]} ${match[2]}` : '';
}

export function courseCodeToId(code) {
  return normalizeCourseCode(code).toLowerCase().replace(/\s+/g, '-');
}

function normalizeApplication(application, courseCredits) {
  const requirementId = cleanText(application?.requirementId, 64)?.toLowerCase();
  const credits = Number(application?.credits ?? courseCredits);

  if (!requirementId || !SAFE_ID.test(requirementId)) {
    throw new Error('Each requirement application needs a valid requirementId.');
  }
  if (
    !Number.isFinite(credits) ||
    credits <= 0 ||
    credits > courseCredits
  ) {
    throw new Error(`Invalid applied credits for requirement ${requirementId}.`);
  }

  return { requirementId, credits };
}

export function normalizeAuditCourse(course, index = 0) {
  const code = normalizeCourseCode(course?.code);
  const credits = Number(course?.credits);
  const status = cleanText(course?.status, 16)?.toLowerCase() || 'completed';
  const sourceType = cleanText(course?.sourceType, 32)?.toLowerCase() || 'uf';

  if (!code) {
    throw new Error(`Course ${index + 1} needs a UF course code such as COP 3503C.`);
  }
  if (!Number.isFinite(credits) || credits <= 0 || credits > 20) {
    throw new Error(`Course ${code} has invalid credits.`);
  }
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Course ${code} has unsupported status "${status}".`);
  }
  if (!VALID_SOURCES.has(sourceType)) {
    throw new Error(`Course ${code} has unsupported sourceType "${sourceType}".`);
  }

  const applications = Array.isArray(course.requirementApplications)
    ? course.requirementApplications.map((item) => normalizeApplication(item, credits))
    : [];
  const uniqueApplications = new Map(
    applications.map((application) => [application.requirementId, application]),
  );

  return {
    code,
    courseId: courseCodeToId(code),
    title: cleanText(course.title, 255),
    credits,
    status,
    sourceType,
    termLabel: cleanText(course.termLabel, 64),
    plannedSemesterId: cleanText(course.plannedSemesterId, 32)?.toLowerCase() || null,
    grade: cleanText(course.grade, 8),
    note: cleanText(course.note, 500),
    requirementApplications: [...uniqueApplications.values()],
  };
}

export function validateAuditImport(payload, studentIdFromPath) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('The request body must be a degree-audit object.');
  }

  const studentId = cleanText(
    studentIdFromPath || payload.student?.id,
    64,
  )?.toLowerCase();
  const programId = cleanText(payload.programId, 64)?.toLowerCase();
  const catalogYear = cleanText(payload.catalogYear, 16);
  const courses = payload.courses;

  if (!studentId || !SAFE_ID.test(studentId)) {
    throw new Error('A valid student ID is required.');
  }
  if (!programId || !SAFE_ID.test(programId)) {
    throw new Error('A valid programId is required.');
  }
  if (!catalogYear) {
    throw new Error('catalogYear is required.');
  }
  if (!Array.isArray(courses)) {
    throw new Error('courses must be an array.');
  }
  if (courses.length > 250) {
    throw new Error('A single audit import cannot contain more than 250 courses.');
  }

  const normalizedCourses = courses.map(normalizeAuditCourse);
  const seen = new Set();
  for (const course of normalizedCourses) {
    if (seen.has(course.code)) {
      throw new Error(`Course ${course.code} appears more than once.`);
    }
    seen.add(course.code);
  }

  return {
    student: {
      id: studentId,
      displayName: cleanText(payload.student?.displayName, 128) || 'UF Student',
    },
    programId,
    catalogYear,
    source: cleanText(payload.source, 32)?.toLowerCase() || 'manual',
    courses: normalizedCourses,
  };
}

function sourceLabel(sourceType) {
  const labels = {
    ap: 'AP credit',
    'dual-enrollment': 'Dual-enrollment credit',
    transfer: 'Transfer credit',
  };
  return labels[sourceType] || null;
}

export function buildAuditResponse({
  student,
  program,
  requirements,
  courses,
  importedAt = null,
  source = 'database',
}) {
  const totalsByRequirement = new Map();
  const notesByRequirement = new Map();

  for (const course of courses) {
    for (const application of course.requirementApplications || []) {
      const current = totalsByRequirement.get(application.requirementId) || {
        completed: 0,
        planned: 0,
      };
      if (course.status === 'completed') {
        current.completed += Number(application.credits);
      } else if (course.status === 'planned' || course.status === 'in-progress') {
        current.planned += Number(application.credits);
      }
      totalsByRequirement.set(application.requirementId, current);

      const label = sourceLabel(course.sourceType);
      if (label) {
        const notes = notesByRequirement.get(application.requirementId) || [];
        notes.push(course.note || `${label}: ${course.code}`);
        notesByRequirement.set(application.requirementId, notes);
      } else if (course.note) {
        const notes = notesByRequirement.get(application.requirementId) || [];
        notes.push(course.note);
        notesByRequirement.set(application.requirementId, notes);
      }
    }
  }

  const formattedRequirements = requirements.map((requirement) => {
    const totalCredits = Number(
      requirement.totalCredits ?? requirement.required_credits ?? 0,
    );
    const totals = totalsByRequirement.get(requirement.id) || {
      completed: 0,
      planned: 0,
    };
    const completedCredits = Math.min(totals.completed, totalCredits);
    const plannedCredits = Math.min(
      totals.planned,
      Math.max(totalCredits - completedCredits, 0),
    );
    const isCompleted = completedCredits >= totalCredits;

    return {
      id: requirement.id,
      name: requirement.name,
      description: requirement.description || '',
      totalCredits,
      completedCredits,
      plannedCredits,
      creditNotes: [...new Set(notesByRequirement.get(requirement.id) || [])],
      nextCourse: isCompleted
        ? 'None'
        : requirement.nextCourse ||
          requirement.next_course_suggestion ||
          'Review matching courses',
    };
  });

  const formattedCourses = courses.map((course) => ({
    courseId: course.courseId || courseCodeToId(course.code),
    code: course.code,
    title: course.title || course.code,
    credits: Number(course.credits),
    academicStatus: course.status === 'in-progress' ? 'planned' : course.status,
    plannedSemester: course.plannedSemesterId || null,
    sourceType: course.sourceType,
    termLabel: course.termLabel || null,
    grade: course.grade || null,
    note: course.note || null,
    requirementIds: (course.requirementApplications || []).map(
      (application) => application.requirementId,
    ),
  }));

  return {
    student,
    program,
    requirements: formattedRequirements,
    courses: formattedCourses,
    summary: {
      completedCredits: formattedRequirements.reduce(
        (sum, requirement) => sum + requirement.completedCredits,
        0,
      ),
      plannedCredits: formattedRequirements.reduce(
        (sum, requirement) => sum + requirement.plannedCredits,
        0,
      ),
      trackedRequirementCredits: formattedRequirements.reduce(
        (sum, requirement) => sum + requirement.totalCredits,
        0,
      ),
    },
    source,
    importedAt,
  };
}
