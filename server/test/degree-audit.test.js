import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAuditResponse,
  normalizeCourseCode,
  validateAuditImport,
} from '../src/services/degree-audit.js';
import { DEMO_AUDIT_IMPORT } from '../src/data/demo-audit.js';
import { findCourseCandidates } from '../src/services/degree-audit-pdf.js';

const requirements = [
  {
    id: 'critical-tracking',
    name: 'Critical Tracking',
    description: 'Early major requirements',
    required_credits: 12,
    next_course_suggestion: 'PHY 2048',
  },
  {
    id: 'major-core',
    name: 'Major Core',
    description: 'Required computer science courses',
    required_credits: 12,
    next_course_suggestion: 'CDA 3101',
  },
  {
    id: 'general-education',
    name: 'General Education',
    description: 'University requirements',
    required_credits: 6,
  },
  {
    id: 'computing-electives',
    name: 'Computing Electives',
    description: 'Upper-level computing electives',
    required_credits: 6,
  },
  {
    id: 'additional-requirements',
    name: 'Additional Requirements',
    description: 'Requirements outside the major',
    required_credits: 6,
  },
];

test('normalizes common UF course-code formats', () => {
  assert.equal(normalizeCourseCode('cop3503c'), 'COP 3503C');
  assert.equal(normalizeCourseCode('  mac-2311 '), 'MAC 2311');
  assert.equal(normalizeCourseCode('not a course'), '');
});

test('validates and normalizes an audit import', () => {
  const audit = validateAuditImport(DEMO_AUDIT_IMPORT, 'demo-student');
  assert.equal(audit.student.id, 'demo-student');
  assert.equal(audit.courses[0].code, 'MAC 2311');
  assert.equal(audit.courses[0].sourceType, 'ap');
});

test('rejects duplicate courses in one import', () => {
  const duplicate = {
    ...DEMO_AUDIT_IMPORT,
    courses: [DEMO_AUDIT_IMPORT.courses[0], DEMO_AUDIT_IMPORT.courses[0]],
  };
  assert.throws(
    () => validateAuditImport(duplicate, 'demo-student'),
    /appears more than once/,
  );
});

test('rejects requirement applications larger than the course', () => {
  const invalidCredits = {
    ...DEMO_AUDIT_IMPORT,
    courses: [
      {
        ...DEMO_AUDIT_IMPORT.courses[0],
        requirementApplications: [
          { requirementId: 'critical-tracking', credits: 5 },
        ],
      },
    ],
  };
  assert.throws(
    () => validateAuditImport(invalidCredits, 'demo-student'),
    /Invalid applied credits/,
  );
});

test('calculates completed and planned requirement progress', () => {
  const audit = validateAuditImport(DEMO_AUDIT_IMPORT, 'demo-student');
  const response = buildAuditResponse({
    student: audit.student,
    program: { id: 'cs-bs-eng', name: 'Computer Science, B.S.' },
    requirements,
    courses: audit.courses,
  });

  const critical = response.requirements.find(
    (requirement) => requirement.id === 'critical-tracking',
  );
  const major = response.requirements.find(
    (requirement) => requirement.id === 'major-core',
  );
  const generalEducation = response.requirements.find(
    (requirement) => requirement.id === 'general-education',
  );

  assert.deepEqual(
    [critical.completedCredits, critical.plannedCredits],
    [8, 4],
  );
  assert.deepEqual(
    [major.completedCredits, major.plannedCredits],
    [4, 8],
  );
  assert.equal(generalEducation.completedCredits, 6);
  assert.equal(generalEducation.nextCourse, 'None');
  assert.match(critical.creditNotes[0], /AP Calculus AB/);
  assert.equal(
    response.courses.find((course) => course.code === 'CDA 3101')
      .plannedSemester,
    'fall-2026',
  );
});

test('hides the next-course suggestion when a requirement is completed', () => {
  const response = buildAuditResponse({
    student: { id: 'test-student', displayName: 'Test Student' },
    program: { id: 'cs-bs-eng', name: 'Computer Science, B.S.' },
    requirements: [requirements[0]],
    courses: [
      {
        code: 'MAC 2311',
        credits: 12,
        status: 'completed',
        sourceType: 'uf',
        requirementApplications: [
          { requirementId: 'critical-tracking', credits: 12 },
        ],
      },
    ],
  });

  assert.equal(response.requirements[0].completedCredits, 12);
  assert.equal(response.requirements[0].nextCourse, 'None');
});

test('caps planned credits at the remaining requirement amount', () => {
  const response = buildAuditResponse({
    student: { id: 'test-student', displayName: 'Test Student' },
    program: { id: 'cs-bs-eng', name: 'Computer Science, B.S.' },
    requirements: [requirements[0]],
    courses: [
      {
        code: 'MAC 2311',
        credits: 10,
        status: 'completed',
        sourceType: 'uf',
        requirementApplications: [
          { requirementId: 'critical-tracking', credits: 10 },
        ],
      },
      {
        code: 'PHY 2048',
        credits: 3,
        status: 'planned',
        sourceType: 'uf',
        requirementApplications: [
          { requirementId: 'critical-tracking', credits: 3 },
        ],
      },
    ],
  });

  assert.equal(response.requirements[0].completedCredits, 10);
  assert.equal(response.requirements[0].plannedCredits, 2);
});

test('finds completed and planned course candidates in degree-audit text', () => {
  const candidates = findCourseCandidates(`
    Fall 2025 COP 3502C Programming Fundamentals 1 A Completed
    Spring 2026 COP 3503C Programming Fundamentals 2 IP In Progress
    Still needed: choose from CAP 4630 or CAP 4641
  `);

  const completed = candidates.find((course) => course.code === 'COP 3502C');
  const planned = candidates.find((course) => course.code === 'COP 3503C');
  const unmet = candidates.find((course) => course.code === 'CAP 4630');

  assert.deepEqual(
    [completed.suggestedStatus, completed.selected],
    ['completed', true],
  );
  assert.deepEqual(
    [planned.suggestedStatus, planned.selected, planned.plannedSemesterId],
    ['planned', true, 'spring-2026'],
  );
  assert.deepEqual(
    [unmet.confidence, unmet.selected],
    ['review', false],
  );
});
