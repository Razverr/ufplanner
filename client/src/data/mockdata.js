export const courses = [
  {
    id: "course-a",
    name: "Introduction to Programming",
    credits: 3,
    requirement: "Core",
    prerequisites: [],
  },
  {
    id: "course-b",
    name: "Advanced Programming",
    credits: 3,
    requirement: "Core",
    prerequisites: ["course-a"],
  },
  {
    id: "course-c",
    name: "Computing Elective",
    credits: 3,
    requirement: "Elective",
    prerequisites: [],
  },
];

// Temporary degree-audit data for the frontend demo. In the finished project,
// this information would come from the student's actual degree audit.
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
    totalCredits: 9,
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
