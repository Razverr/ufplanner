export const DEMO_STUDENT_ID = 'demo-student';

export const DEMO_AUDIT_IMPORT = {
  student: {
    id: DEMO_STUDENT_ID,
    displayName: 'Demo Student',
  },
  programId: 'cs-bs-eng',
  catalogYear: '2026-2027',
  source: 'demo',
  courses: [
    {
      code: 'MAC 2311',
      title: 'Analytic Geometry and Calculus 1',
      credits: 4,
      status: 'completed',
      sourceType: 'ap',
      termLabel: 'Transfer credit',
      grade: 'P',
      note: 'AP Calculus AB applied as MAC 2311',
      requirementApplications: [
        { requirementId: 'critical-tracking', credits: 4 },
      ],
    },
    {
      code: 'MAC 2312',
      title: 'Analytic Geometry and Calculus 2',
      credits: 4,
      status: 'completed',
      sourceType: 'uf',
      termLabel: 'Fall 2025',
      grade: 'A',
      requirementApplications: [
        { requirementId: 'critical-tracking', credits: 4 },
      ],
    },
    {
      code: 'PHY 2048',
      title: 'Physics with Calculus 1',
      credits: 3,
      status: 'planned',
      sourceType: 'uf',
      plannedSemesterId: 'spring-2026',
      requirementApplications: [
        { requirementId: 'critical-tracking', credits: 3 },
      ],
    },
    {
      code: 'PHY 2048L',
      title: 'Physics with Calculus 1 Laboratory',
      credits: 1,
      status: 'planned',
      sourceType: 'uf',
      plannedSemesterId: 'spring-2026',
      requirementApplications: [
        { requirementId: 'critical-tracking', credits: 1 },
      ],
    },
    {
      code: 'COP 3502C',
      title: 'Programming Fundamentals 1',
      credits: 4,
      status: 'completed',
      sourceType: 'uf',
      termLabel: 'Fall 2025',
      grade: 'A-',
      requirementApplications: [
        { requirementId: 'major-core', credits: 4 },
      ],
    },
    {
      code: 'COP 3503C',
      title: 'Programming Fundamentals 2',
      credits: 4,
      status: 'planned',
      sourceType: 'uf',
      plannedSemesterId: 'spring-2026',
      requirementApplications: [
        { requirementId: 'major-core', credits: 4 },
      ],
    },
    {
      code: 'COT 3100',
      title: 'Applications of Discrete Structures',
      credits: 3,
      status: 'planned',
      sourceType: 'uf',
      plannedSemesterId: 'spring-2026',
      requirementApplications: [
        { requirementId: 'major-core', credits: 3 },
      ],
    },
    {
      code: 'CDA 3101',
      title: 'Introduction to Computer Organization',
      credits: 3,
      status: 'planned',
      sourceType: 'uf',
      plannedSemesterId: 'fall-2026',
      requirementApplications: [
        { requirementId: 'major-core', credits: 3 },
      ],
    },
    {
      code: 'ENC 1101',
      title: 'Expository and Argumentative Writing',
      credits: 3,
      status: 'completed',
      sourceType: 'dual-enrollment',
      termLabel: 'Transfer credit',
      grade: 'A',
      note: 'Dual-enrollment ENC 1101 applied to Composition',
      requirementApplications: [
        { requirementId: 'general-education', credits: 3 },
      ],
    },
    {
      code: 'ENC 1102',
      title: 'Argument and Persuasion',
      credits: 3,
      status: 'completed',
      sourceType: 'uf',
      termLabel: 'Fall 2025',
      grade: 'A',
      requirementApplications: [
        { requirementId: 'general-education', credits: 3 },
      ],
    },
    {
      code: 'CIS 4930',
      title: 'Special Topics in Computer Science',
      credits: 3,
      status: 'planned',
      sourceType: 'uf',
      plannedSemesterId: 'fall-2026',
      requirementApplications: [
        { requirementId: 'computing-electives', credits: 3 },
      ],
    },
    {
      code: 'SPN 1130',
      title: 'Beginning Spanish 1',
      credits: 5,
      status: 'completed',
      sourceType: 'uf',
      termLabel: 'Spring 2025',
      grade: 'B+',
      requirementApplications: [
        { requirementId: 'additional-requirements', credits: 5 },
      ],
    },
  ],
};
