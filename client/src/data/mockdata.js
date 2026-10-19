/**
 * ──────────────────────────────────────────────────────────────────────
 *  ILLUSTRATIVE MOCK DATA — UF Planner Prototype
 *
 *  All courses, prerequisites, and degree-audit figures below are
 *  fictional.  They exist only to demonstrate the Course Discovery and
 *  Requirements & Progress panels.  Do not treat them as real UF
 *  catalog information.
 *
 *  Prerequisite logic in this prototype is simplified:
 *    • Each prerequisite is a single course id (no AND/OR trees).
 *    • A prerequisite is "satisfied" if it is completed or planned in
 *      an earlier semester than the destination semester.
 *    • Co-requisites and minimum-grade rules are not modeled.
 * ──────────────────────────────────────────────────────────────────────
 */

// ── Semesters ───────────────────────────────────────────────────────
export const semesters = [
  { id: "fall-2025", label: "Fall 2025" },
  { id: "spring-2026", label: "Spring 2026" },
  { id: "summer-2026", label: "Summer 2026" },
  { id: "fall-2026", label: "Fall 2026" },
];

// ── Courses ─────────────────────────────────────────────────────────
//
// academicStatus:  "completed" | "planned" | "not-planned"
// plannedSemester: semester id when planned (null if not planned)
// offerings:       { [semesterId]: "available" | "predicted" | "unknown" }
// requirementIds:  which degreeRequirements this course can satisfy
// prerequisites:   array of course ids (simple AND — all must be met)
//
export const courses = [
  // ── Critical Tracking ────────────────────────────────────────────
  {
    id: "mac-2311",
    code: "MAC 2311",
    title: "Analytic Geometry and Calculus 1",
    credits: 4,
    description:
      "Limits, continuity, differentiation, and integration of single-variable functions. Applications to motion, area, and optimization.",
    requirementIds: ["critical-tracking"],
    prerequisites: [],
    academicStatus: "completed",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "available",
      "fall-2026": "available",
    },
  },
  {
    id: "mac-2312",
    code: "MAC 2312",
    title: "Analytic Geometry and Calculus 2",
    credits: 4,
    description:
      "Techniques of integration, sequences, series, and parametric curves.",
    requirementIds: ["critical-tracking"],
    prerequisites: ["mac-2311"],
    academicStatus: "completed",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "predicted",
      "fall-2026": "available",
    },
  },
  {
    id: "phy-2048",
    code: "PHY 2048",
    title: "Physics with Calculus 1",
    credits: 4,
    description:
      "Newtonian mechanics, energy, momentum, rotational motion, oscillations, and thermodynamics with calculus-based methods.",
    requirementIds: ["critical-tracking"],
    prerequisites: ["mac-2311"],
    academicStatus: "planned",
    plannedSemester: "spring-2026",
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "predicted",
      "fall-2026": "available",
    },
  },

  // ── Major Core ───────────────────────────────────────────────────
  {
    id: "cop-3502",
    code: "COP 3502",
    title: "Programming Fundamentals 1",
    credits: 3,
    description:
      "Introduction to programming in C, including data types, control structures, functions, arrays, pointers, and dynamic memory.",
    requirementIds: ["major-core"],
    prerequisites: [],
    academicStatus: "completed",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "available",
      "fall-2026": "available",
    },
  },
  {
    id: "cop-3503",
    code: "COP 3503",
    title: "Programming Fundamentals 2",
    credits: 3,
    description:
      "Object-oriented programming in Java, generic types, collections, recursion, and introductory data structures.",
    requirementIds: ["major-core"],
    prerequisites: ["cop-3502"],
    academicStatus: "planned",
    plannedSemester: "spring-2026",
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "unknown",
      "fall-2026": "available",
    },
  },
  {
    id: "cda-3101",
    code: "CDA 3101",
    title: "Introduction to Computer Organization",
    credits: 3,
    description:
      "Digital logic, processor architecture, assembly language, memory hierarchy, and I/O systems.",
    requirementIds: ["major-core"],
    prerequisites: ["cop-3502"],
    academicStatus: "not-planned",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "predicted",
      "summer-2026": "unknown",
      "fall-2026": "available",
    },
  },
  {
    id: "cop-3530",
    code: "COP 3530",
    title: "Data Structures and Algorithms",
    credits: 3,
    description:
      "Analysis and design of data structures — trees, graphs, heaps, hash tables — and fundamental algorithms.",
    requirementIds: ["major-core"],
    prerequisites: ["cop-3503"],
    academicStatus: "not-planned",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "unknown",
      "fall-2026": "predicted",
    },
  },

  // ── General Education ────────────────────────────────────────────
  {
    id: "enc-1101",
    code: "ENC 1101",
    title: "Expository and Argumentative Writing",
    credits: 3,
    description:
      "Development of college-level writing skills through expository and argumentative essays.",
    requirementIds: ["general-education"],
    prerequisites: [],
    academicStatus: "completed",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "available",
      "fall-2026": "available",
    },
  },
  {
    id: "enc-1102",
    code: "ENC 1102",
    title: "Argument and Persuasion",
    credits: 3,
    description:
      "Advanced composition emphasizing research, argumentation, and persuasive discourse.",
    requirementIds: ["general-education"],
    prerequisites: ["enc-1101"],
    academicStatus: "completed",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "available",
      "fall-2026": "available",
    },
  },

  // ── Computing Electives ──────────────────────────────────────────
  {
    id: "cis-4930",
    code: "CIS 4930",
    title: "Special Topics in Computer Science",
    credits: 3,
    description:
      "Rotating topics in emerging areas of computing; topic varies each semester.",
    requirementIds: ["computing-electives"],
    prerequisites: ["cop-3503"],
    academicStatus: "planned",
    plannedSemester: "fall-2026",
    offerings: {
      "fall-2025": "unknown",
      "spring-2026": "unknown",
      "summer-2026": "unknown",
      "fall-2026": "predicted",
    },
  },
  {
    id: "cap-4630",
    code: "CAP 4630",
    title: "Artificial Intelligence",
    credits: 3,
    description:
      "Search algorithms, knowledge representation, probabilistic reasoning, and introductory machine learning.",
    requirementIds: ["computing-electives"],
    prerequisites: ["cop-3530"],
    academicStatus: "not-planned",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "predicted",
      "summer-2026": "unknown",
      "fall-2026": "available",
    },
  },
  {
    id: "cnt-4714",
    code: "CNT 4714",
    title: "Database Systems",
    credits: 3,
    description:
      "Relational data modeling, SQL, normalization, transaction processing, and query optimization.",
    requirementIds: ["computing-electives"],
    prerequisites: ["cop-3503"],
    academicStatus: "not-planned",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "unknown",
      "fall-2026": "available",
    },
  },
  {
    id: "cen-3031",
    code: "CEN 3031",
    title: "Introduction to Software Engineering",
    credits: 3,
    description:
      "Software development methodologies, requirements analysis, design patterns, version control, and team collaboration.",
    requirementIds: ["computing-electives"],
    prerequisites: ["cop-3502"],
    academicStatus: "not-planned",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "predicted",
      "fall-2026": "available",
    },
  },

  // ── Additional Requirements ──────────────────────────────────────
  {
    id: "spn-1130",
    code: "SPN 1130",
    title: "Beginning Spanish 1",
    credits: 3,
    description:
      "Introduction to Spanish language and Hispanic cultures; fundamental skills in listening, speaking, reading, and writing.",
    requirementIds: ["additional-requirements"],
    prerequisites: [],
    academicStatus: "completed",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "predicted",
      "fall-2026": "available",
    },
  },
  {
    id: "spn-1131",
    code: "SPN 1131",
    title: "Beginning Spanish 2",
    credits: 3,
    description:
      "Continuation of SPN 1130, with emphasis on conversational skills and cultural literacy.",
    requirementIds: ["additional-requirements"],
    prerequisites: ["spn-1130"],
    academicStatus: "not-planned",
    plannedSemester: null,
    offerings: {
      "fall-2025": "available",
      "spring-2026": "available",
      "summer-2026": "unknown",
      "fall-2026": "available",
    },
  },
];

// ── Degree Requirements (degree audit rows) ─────────────────────────
//
// Temporary degree-audit data for the frontend demo.  In the finished
// project this information would come from the student's actual degree
// audit.  Each row carries its own credit totals and a suggested next
// course.
export const degreeRequirements = [
  {
    id: "critical-tracking",
    name: "Critical Tracking",
    description:
      "Courses that should be completed early to stay on track in the major.",
    totalCredits: 12,
    completedCredits: 8,
    plannedCredits: 4,
    creditNotes: ["AP Calculus AB applied as MAC 2311"],
    nextCourse: "PHY 2048 — Physics with Calculus 1",
  },
  {
    id: "major-core",
    name: "Major Core",
    description:
      "Required computer science courses that every student in the major takes.",
    totalCredits: 12,
    completedCredits: 3,
    plannedCredits: 3,
    creditNotes: [],
    nextCourse: "CDA 3101 — Introduction to Computer Organization",
  },
  {
    id: "general-education",
    name: "General Education",
    description:
      "University-wide requirements in areas such as writing, humanities, and science.",
    totalCredits: 6,
    completedCredits: 6,
    plannedCredits: 0,
    creditNotes: ["Dual-enrollment ENC 1101 applied to Composition"],
    nextCourse: "No additional course needed",
  },
  {
    id: "computing-electives",
    name: "Computing Electives",
    description:
      "Upper-level computing courses that can be chosen based on a student's interests.",
    totalCredits: 6,
    completedCredits: 0,
    plannedCredits: 3,
    creditNotes: [],
    nextCourse: "CIS 4930 — Special Topics in Computer Science",
  },
  {
    id: "additional-requirements",
    name: "Additional Requirements",
    description:
      "Requirements outside the major, including a minor or foreign-language sequence.",
    totalCredits: 6,
    completedCredits: 3,
    plannedCredits: 0,
    creditNotes: [],
    nextCourse: "SPN 1131 — Beginning Spanish 2",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

/** Map requirement id → readable label.  Used by course cards. */
export const requirementLabels = Object.fromEntries(
  degreeRequirements.map((r) => [r.id, r.name]),
);

/**
 * Semester ordering for prerequisite checks.  Lower index = earlier.
 * A prerequisite is satisfied if the required course is completed or
 * planned in a semester with a strictly lower index than the
 * destination semester.
 */
export const semesterOrder = semesters.map((s) => s.id);
