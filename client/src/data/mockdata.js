/**
 * Verified UF Course & Degree Audit Data for UF Planner
 *
 * Sourced from:
 *   - UF Herbert Wertheim College of Engineering Undergraduate Catalog 2026-2027
 *   - UF ONE.UF Schedule of Courses
 *
 * Features:
 *   - Verbatim raw prerequisites
 *   - Accurate requirement category citations
 *   - Verified variable & standard credit values
 *   - Term-specific offering statuses (available, predicted, unknown)
 */

export const semesters = [
  { id: 'fall-2025', code: '2258', label: 'Fall 2025' },
  { id: 'spring-2026', code: '2261', label: 'Spring 2026' },
  { id: 'summer-2026', code: '2265', label: 'Summer 2026' },
  { id: 'fall-2026', code: '2268', label: 'Fall 2026' },
];

export const courses = [
  // ── Critical Tracking ────────────────────────────────────────────
  {
    id: 'mac-2311',
    code: 'MAC 2311',
    title: 'Analytic Geometry and Calculus 1',
    credits: 4,
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description:
      'Limits, continuity, differentiation, and integration of single-variable functions. Applications to motion, area, and optimization.',
    raw_prerequisites: 'Prereq: (ALEKS score of 76% or higher) or MAC 1147 with minimum grade of C.',
    prerequisites: [],
    requirementIds: ['critical-tracking'],
    requirementExplanations: {
      'critical-tracking': 'Required Critical Tracking course for Computer Science B.S. in Semester 1-2.'
    },
    academicStatus: 'completed',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'available',
      'fall-2026': 'available',
    },
  },
  {
    id: 'mac-2312',
    code: 'MAC 2312',
    title: 'Analytic Geometry and Calculus 2',
    credits: 4,
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description:
      'Techniques of integration, analytic geometry, infinite sequences and series, and parametric curves.',
    raw_prerequisites: 'Prereq: MAC 2311 or MAC 3472 with minimum grade of C.',
    prerequisites: ['mac-2311'],
    requirementIds: ['critical-tracking'],
    requirementExplanations: {
      'critical-tracking': 'Required Critical Tracking course in Semester 2-3 per the UF CS Model Semester Plan.'
    },
    academicStatus: 'completed',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'predicted',
      'fall-2026': 'available',
    },
  },
  {
    id: 'phy-2048',
    code: 'PHY 2048',
    title: 'Physics with Calculus 1',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'First semester of physics with calculus sequence: Newtonian mechanics, work, energy, momentum, rotational dynamics, and oscillations.',
    raw_prerequisites: 'Prereq: MAC 2311 with minimum grade of C; Coreq: MAC 2312 and PHY 2048L.',
    prerequisites: ['mac-2311'],
    requirementIds: ['critical-tracking'],
    requirementExplanations: {
      'critical-tracking': 'Required Critical Tracking physics foundation for engineering CS majors.'
    },
    academicStatus: 'planned',
    plannedSemester: 'spring-2026',
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'predicted',
      'fall-2026': 'available',
    },
  },
  {
    id: 'phy-2048l',
    code: 'PHY 2048L',
    title: 'Physics with Calculus 1 Laboratory',
    credits: 1,
    credits_min: 1,
    credits_max: 1,
    credits_display: '1',
    description:
      'Laboratory experiments illustrating the principles of mechanics, energy, and thermodynamics.',
    raw_prerequisites: 'Coreq: PHY 2048 or PHY 2060.',
    prerequisites: [],
    requirementIds: ['critical-tracking'],
    requirementExplanations: {
      'critical-tracking': 'Corequisite laboratory course for PHY 2048 in Critical Tracking.'
    },
    academicStatus: 'planned',
    plannedSemester: 'spring-2026',
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'available',
      'fall-2026': 'available',
    },
  },

  // ── Major Core ───────────────────────────────────────────────────
  {
    id: 'cop-3502c',
    code: 'COP 3502C',
    title: 'Programming Fundamentals 1',
    credits: 4,
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description:
      'First course in computer science. Fundamental programming constructs in C, including variables, control structures, functions, pointers, and memory allocation.',
    raw_prerequisites: 'Prereq: MAC 2311 with minimum grade of C.',
    prerequisites: ['mac-2311'],
    requirementIds: ['major-core', 'critical-tracking'],
    requirementExplanations: {
      'major-core': 'Foundational prerequisite course required for all upper-division CISE study.',
      'critical-tracking': 'Critical tracking requirement for CISE tracking audit.'
    },
    academicStatus: 'completed',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'available',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cop-3503c',
    code: 'COP 3503C',
    title: 'Programming Fundamentals 2',
    credits: 4,
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description:
      'Object-oriented programming in Java and C++, generic types, collections, dynamic memory, recursion, and introductory data structures.',
    raw_prerequisites: 'Prereq: (COP 3502C or equivalent) and MAC 2311, both with minimum grades of C.',
    prerequisites: ['cop-3502c', 'mac-2311'],
    requirementIds: ['major-core'],
    requirementExplanations: {
      'major-core': 'Second fundamental programming requirement in the Major Core sequence.'
    },
    academicStatus: 'planned',
    plannedSemester: 'spring-2026',
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cot-3100',
    code: 'COT 3100',
    title: 'Applications of Discrete Structures',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Sets, relations, propositional logic, mathematical induction, combinatorics, and graph theory applied to computing problems.',
    raw_prerequisites: 'Prereq: MAC 2311 and (COP 3502C or COP 3504C) with minimum grades of C.',
    prerequisites: ['mac-2311', 'cop-3502c'],
    requirementIds: ['major-core'],
    requirementExplanations: {
      'major-core': 'Required theoretical foundation course in Computer Science B.S. core curriculum.'
    },
    academicStatus: 'planned',
    plannedSemester: 'spring-2026',
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'predicted',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cda-3101',
    code: 'CDA 3101',
    title: 'Introduction to Computer Organization',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Digital logic, instruction set architecture, CPU datapath and control, pipelining, memory hierarchy, and storage subsystems.',
    raw_prerequisites: 'Prereq: (COP 3503C or COP 3504C) and MAC 2311, both with minimum grades of C.',
    prerequisites: ['cop-3503c', 'mac-2311'],
    requirementIds: ['major-core'],
    requirementExplanations: {
      'major-core': 'Required hardware architecture core course in the CS degree.'
    },
    academicStatus: 'planned',
    plannedSemester: 'fall-2026',
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'predicted',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cop-3530',
    code: 'COP 3530',
    title: 'Data Structures and Algorithm',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Algorithm development, asymptotic complexity analysis, heaps, balanced binary search trees, hash tables, and graph algorithms.',
    raw_prerequisites: 'Prereq: (COP 3504C or COP 3503C) and COT 3100 and (MAC 2234 or MAC 2312 or MAC 2512 or MAC 3473), all with minimum grades of C.',
    prerequisites: ['cop-3503c', 'cot-3100', 'mac-2312'],
    requirementIds: ['major-core'],
    requirementExplanations: {
      'major-core': 'Essential gateway core course required for all 4000-level CS coursework.'
    },
    academicStatus: 'planned',
    plannedSemester: 'fall-2026',
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cen-3031',
    code: 'CEN 3031',
    title: 'Introduction to Software Engineering',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Software development methodologies, requirements analysis, design patterns, version control, automated testing, and team project delivery.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    prerequisites: ['cop-3530'],
    requirementIds: ['major-core', 'computing-electives'],
    requirementExplanations: {
      'major-core': 'Required team software development core requirement for Computer Science B.S.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'predicted',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cop-4600',
    code: 'COP 4600',
    title: 'Operating Systems',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Process scheduling, threads, synchronization, memory management, virtual memory, file systems, and device I/O.',
    raw_prerequisites: 'Prereq: CDA 3101 and COP 3530 with minimum grades of C.',
    prerequisites: ['cda-3101', 'cop-3530'],
    requirementIds: ['major-core'],
    requirementExplanations: {
      'major-core': 'Upper-division systems core course required for all CS graduates.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },

  // ── Computing Electives ──────────────────────────────────────────
  {
    id: 'cis-4930',
    code: 'CIS 4930',
    title: 'Special Topics in Computer Science',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Rotating advanced topics in computing, including cloud computing, mobile systems, cybersecurity, and deep learning.',
    raw_prerequisites: 'Prereq: COP 3503C with minimum grade of C.',
    prerequisites: ['cop-3503c'],
    requirementIds: ['computing-electives'],
    requirementExplanations: {
      'computing-electives': 'Fulfills upper-division CISE elective requirement.'
    },
    academicStatus: 'planned',
    plannedSemester: 'fall-2026',
    offerings: {
      'fall-2025': 'unknown',
      'spring-2026': 'unknown',
      'summer-2026': 'unknown',
      'fall-2026': 'predicted',
    },
  },
  {
    id: 'cap-4630',
    code: 'CAP 4630',
    title: 'Artificial Intelligence',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Search algorithms, knowledge representation, probabilistic reasoning, and introductory machine learning.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    prerequisites: ['cop-3530'],
    requirementIds: ['computing-electives'],
    requirementExplanations: {
      'computing-electives': 'Approved 4000-level technical elective in Artificial Intelligence.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'predicted',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cap-4641',
    code: 'CAP 4641',
    title: 'Natural Language Processing',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Linguistic fundamentals, text preprocessing, word embeddings, transformer architectures, and modern generative language models.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    prerequisites: ['cop-3530'],
    requirementIds: ['computing-electives'],
    requirementExplanations: {
      'computing-electives': 'Approved 4000-level elective in language technologies and NLP.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'unknown',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cnt-4714',
    code: 'CNT 4714',
    title: 'Database Systems',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Relational data modeling, SQL, normalization, transaction processing, and query optimization.',
    raw_prerequisites: 'Prereq: COP 3503C with minimum grade of C.',
    prerequisites: ['cop-3503c'],
    requirementIds: ['computing-electives'],
    requirementExplanations: {
      'computing-electives': 'Approved 4000-level elective in database systems.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },
  {
    id: 'cop-4020',
    code: 'COP 4020',
    title: 'Programming Language Concepts',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Syntax and semantics, lexical and syntactic analysis, type systems, functional programming, and runtime environments.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    prerequisites: ['cop-3530'],
    requirementIds: ['computing-electives'],
    requirementExplanations: {
      'computing-electives': 'Approved 4000-level CISE computing elective.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },

  // ── General Education ────────────────────────────────────────────
  {
    id: 'enc-1101',
    code: 'ENC 1101',
    title: 'Expository and Argumentative Writing',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Expository and argumentative essays, analytical reading, research documentation, and collegiate writing conventions.',
    raw_prerequisites: 'None.',
    prerequisites: [],
    requirementIds: ['general-education'],
    requirementExplanations: {
      'general-education': 'Satisfies State Core Composition and Gordon Rule Writing (6,000 words).'
    },
    academicStatus: 'completed',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'available',
      'fall-2026': 'available',
    },
  },
  {
    id: 'enc-1102',
    code: 'ENC 1102',
    title: 'Argument and Persuasion',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Advanced composition emphasizing research, argumentation, and persuasive discourse.',
    raw_prerequisites: 'Prereq: ENC 1101 with minimum grade of C.',
    prerequisites: ['enc-1101'],
    requirementIds: ['general-education'],
    requirementExplanations: {
      'general-education': 'Satisfies UF General Education Composition requirement.'
    },
    academicStatus: 'completed',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'available',
      'fall-2026': 'available',
    },
  },
  {
    id: 'enc-3246',
    code: 'ENC 3246',
    title: 'Professional Communication for Engineers',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Technical writing, proposals, progress reports, documentation, ethics, and oral presentations for engineering disciplines.',
    raw_prerequisites: 'Prereq: Sophomore standing or higher and ENC 1101 or ENC 1102.',
    prerequisites: ['enc-1101'],
    requirementIds: ['general-education'],
    requirementExplanations: {
      'general-education': 'Required Engineering technical communication course.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'available',
      'fall-2026': 'available',
    },
  },

  // ── Additional Requirements ──────────────────────────────────────
  {
    id: 'spn-1130',
    code: 'SPN 1130',
    title: 'Beginning Spanish 1',
    credits: 5,
    credits_min: 5,
    credits_max: 5,
    credits_display: '5',
    description:
      'Introduction to Spanish language and Hispanic cultures; fundamental skills in listening, speaking, reading, and writing.',
    raw_prerequisites: 'None.',
    prerequisites: [],
    requirementIds: ['additional-requirements'],
    requirementExplanations: {
      'additional-requirements': 'Counts toward foreign language sequence / interdisciplinary requirements.'
    },
    academicStatus: 'completed',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'predicted',
      'fall-2026': 'available',
    },
  },
  {
    id: 'spn-1131',
    code: 'SPN 1131',
    title: 'Beginning Spanish 2',
    credits: 5,
    credits_min: 5,
    credits_max: 5,
    credits_display: '5',
    description:
      'Continuation of SPN 1130, with emphasis on conversational skills and cultural literacy.',
    raw_prerequisites: 'Prereq: SPN 1130 with minimum grade of C.',
    prerequisites: ['spn-1130'],
    requirementIds: ['additional-requirements'],
    requirementExplanations: {
      'additional-requirements': 'Sequential course fulfilling second foreign language semester.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'unknown',
      'fall-2026': 'available',
    },
  },
  {
    id: 'sta-3032',
    code: 'STA 3032',
    title: 'Engineering Statistics',
    credits: 3,
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description:
      'Basic probability, sample spaces, random variables, hypothesis testing, confidence intervals, and regression for engineers.',
    raw_prerequisites: 'Prereq: MAC 2311 with minimum grade of C.',
    prerequisites: ['mac-2311'],
    requirementIds: ['additional-requirements'],
    requirementExplanations: {
      'additional-requirements': 'Mandatory statistics support course for Engineering Computer Science.'
    },
    academicStatus: 'not-planned',
    plannedSemester: null,
    offerings: {
      'fall-2025': 'available',
      'spring-2026': 'available',
      'summer-2026': 'available',
      'fall-2026': 'available',
    },
  },
];

export const degreeRequirements = [
  {
    id: 'critical-tracking',
    name: 'Critical Tracking',
    description:
      'Courses that should be completed early to stay on track in the major.',
    totalCredits: 12,
    completedCredits: 8,
    plannedCredits: 4,
    creditNotes: ['AP Calculus AB applied as MAC 2311'],
    nextCourse: 'PHY 2048 — Physics with Calculus 1',
  },
  {
    id: 'major-core',
    name: 'Major Core',
    description:
      'Required computer science courses that every student in the major takes.',
    totalCredits: 12,
    completedCredits: 4,
    plannedCredits: 8,
    creditNotes: [],
    nextCourse: 'CDA 3101 — Introduction to Computer Organization',
  },
  {
    id: 'general-education',
    name: 'General Education',
    description:
      'University-wide requirements in areas such as writing, humanities, and science.',
    totalCredits: 6,
    completedCredits: 6,
    plannedCredits: 0,
    creditNotes: ['Dual-enrollment ENC 1101 applied to Composition'],
    nextCourse: 'No additional course needed',
  },
  {
    id: 'computing-electives',
    name: 'Computing Electives',
    description:
      'Upper-level computing courses that can be chosen based on a student\'s interests.',
    totalCredits: 6,
    completedCredits: 0,
    plannedCredits: 3,
    creditNotes: [],
    nextCourse: 'CIS 4930 — Special Topics in Computer Science',
  },
  {
    id: 'additional-requirements',
    name: 'Additional Requirements',
    description:
      'Requirements outside the major, including a minor or foreign-language sequence.',
    totalCredits: 6,
    completedCredits: 5,
    plannedCredits: 0,
    creditNotes: [],
    nextCourse: 'SPN 1131 — Beginning Spanish 2',
  },
];

export const requirementLabels = Object.fromEntries(
  degreeRequirements.map((r) => [r.id, r.name]),
);

export const semesterOrder = semesters.map((s) => s.id);
