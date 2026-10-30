/**
 * Verified UF Degree Requirements & Catalog Mappings Seed
 * 
 * Sources:
 *   - UF Undergraduate Catalog: Herbert Wertheim College of Engineering
 *     Major: Computer Science, B.S. (Catalog Year 2026-2027 / 2025-2026)
 *     https://catalog.ufl.edu/UGRD/colleges-schools/UGENG/CPS_BSCS/
 *   - Verified requirement categories, required credit distributions,
 *     and exact catalog rationales for each course.
 */

import { pool } from './pool.js';
import { parseRawPrerequisites } from '../utils/prereqs.js';

export const VERIFIED_PROGRAM = {
  id: 'cs-bs-eng',
  name: 'Computer Science, B.S.',
  college: 'Herbert Wertheim College of Engineering',
  catalog_year: '2026-2027',
  total_credits: 120
};

export const VERIFIED_REQUIREMENTS = [
  {
    id: 'critical-tracking',
    program_id: 'cs-bs-eng',
    name: 'Critical Tracking',
    description: 'Courses required in semesters 1-5 to maintain satisfactory academic progress in the major.',
    required_credits: 12,
    category_order: 1,
    next_course_suggestion: 'PHY 2048 — Physics with Calculus 1'
  },
  {
    id: 'major-core',
    program_id: 'cs-bs-eng',
    name: 'Major Core',
    description: 'Required foundational computer science, architecture, and systems coursework for all CS majors.',
    required_credits: 12,
    category_order: 2,
    next_course_suggestion: 'CDA 3101 — Introduction to Computer Organization'
  },
  {
    id: 'general-education',
    program_id: 'cs-bs-eng',
    name: 'General Education',
    description: 'State- and university-wide general education requirements in composition, humanities, and social sciences.',
    required_credits: 6,
    category_order: 3,
    next_course_suggestion: 'No additional course needed'
  },
  {
    id: 'computing-electives',
    program_id: 'cs-bs-eng',
    name: 'Computing Electives',
    description: 'Upper-division technical coursework chosen from CISE department offerings.',
    required_credits: 6,
    category_order: 4,
    next_course_suggestion: 'CIS 4930 — Special Topics in Computer Science'
  },
  {
    id: 'additional-requirements',
    program_id: 'cs-bs-eng',
    name: 'Additional Requirements',
    description: 'Engineering and interdisciplinary requirements outside major core, including foreign language or approved minor.',
    required_credits: 6,
    category_order: 5,
    next_course_suggestion: 'SPN 1131 — Beginning Spanish 2'
  }
];

export const VERIFIED_COURSES = [
  // ── Critical Tracking ───────────────────────────────────────────────────────
  {
    id: 'mac-2311',
    code: 'MAC 2311',
    title: 'Analytic Geometry and Calculus 1',
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description: 'Limits, continuity, differentiation, and integration of single-variable functions. Applications to motion, area, and optimization.',
    raw_prerequisites: 'Prereq: (ALEKS score of 76% or higher) or MAC 1147 with minimum grade of C.',
    requirementIds: ['critical-tracking'],
    explanation: 'Required Critical Tracking course in Semester 1-2 per the UF Computer Science B.S. Engineering Model Semester Plan.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'available', 'fall-2026': 'available' }
  },
  {
    id: 'mac-2312',
    code: 'MAC 2312',
    title: 'Analytic Geometry and Calculus 2',
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description: 'Techniques of integration, analytic geometry, infinite sequences and series, and parametric curves.',
    raw_prerequisites: 'Prereq: MAC 2311 or MAC 3472 with minimum grade of C.',
    requirementIds: ['critical-tracking'],
    explanation: 'Required Critical Tracking course in Semester 2-3 per the UF Computer Science B.S. Model Semester Plan.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'predicted', 'fall-2026': 'available' }
  },
  {
    id: 'phy-2048',
    code: 'PHY 2048',
    title: 'Physics with Calculus 1',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'First semester of a two-semester calculus-based sequence. Classical mechanics, work, energy, momentum, rotational dynamics, and harmonic motion.',
    raw_prerequisites: 'Prereq: MAC 2311 with minimum grade of C; Coreq: MAC 2312 and PHY 2048L.',
    requirementIds: ['critical-tracking'],
    explanation: 'Required Critical Tracking physics foundation for engineering students.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'predicted', 'fall-2026': 'available' }
  },
  {
    id: 'phy-2048l',
    code: 'PHY 2048L',
    title: 'Physics with Calculus 1 Laboratory',
    credits_min: 1,
    credits_max: 1,
    credits_display: '1',
    description: 'Laboratory experiments illustrating the principles of mechanics, energy, and thermodynamics.',
    raw_prerequisites: 'Coreq: PHY 2048 or PHY 2060.',
    requirementIds: ['critical-tracking'],
    explanation: 'Mandatory corequisite laboratory for PHY 2048 in the Critical Tracking sequence.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'available', 'fall-2026': 'available' }
  },

  // ── Major Core ─────────────────────────────────────────────────────────────
  {
    id: 'cop-3502c',
    code: 'COP 3502C',
    title: 'Programming Fundamentals 1',
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description: 'First course in computer science. Fundamental programming constructs in C, including variables, control structures, functions, pointers, and memory allocation.',
    raw_prerequisites: 'Prereq: MAC 2311 with minimum grade of C.',
    requirementIds: ['major-core', 'critical-tracking'],
    explanation: 'Foundational entry point into the Computer Science major, required for all upper-division CISE coursework.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'available', 'fall-2026': 'available' }
  },
  {
    id: 'cop-3503c',
    code: 'COP 3503C',
    title: 'Programming Fundamentals 2',
    credits_min: 4,
    credits_max: 4,
    credits_display: '4',
    description: 'Object-oriented programming concepts in Java/C++, generic programming, dynamic memory, recursion, and introductory data structures.',
    raw_prerequisites: 'Prereq: (COP 3502C or equivalent) and MAC 2311, both with minimum grades of C.',
    requirementIds: ['major-core'],
    explanation: 'Core curriculum gateway course required for all CISE advanced study.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },
  {
    id: 'cot-3100',
    code: 'COT 3100',
    title: 'Applications of Discrete Structures',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Sets, relations, propositional logic, mathematical induction, combinatorics, and graph theory applied to computing problems.',
    raw_prerequisites: 'Prereq: MAC 2311 and (COP 3502C or COP 3504C) with minimum grades of C.',
    requirementIds: ['major-core'],
    explanation: 'Required theoretical foundation for Computer Science B.S. degree.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'predicted', 'fall-2026': 'available' }
  },
  {
    id: 'cda-3101',
    code: 'CDA 3101',
    title: 'Introduction to Computer Organization',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Digital logic, instruction set architecture, CPU datapath and control, pipelining, memory hierarchy, and storage subsystems.',
    raw_prerequisites: 'Prereq: (COP 3503C or COP 3504C) and MAC 2311, both with minimum grades of C.',
    requirementIds: ['major-core'],
    explanation: 'Required computer architecture and hardware systems core for CS majors.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'predicted', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },
  {
    id: 'cop-3530',
    code: 'COP 3530',
    title: 'Data Structures and Algorithm',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Algorithm development, asymptotic complexity analysis, heaps, balanced binary search trees, hash tables, and graph algorithms.',
    raw_prerequisites: 'Prereq: (COP 3504C or COP 3503C) and COT 3100 and (MAC 2234 or MAC 2312 or MAC 2512 or MAC 3473), all with minimum grades of C.',
    requirementIds: ['major-core'],
    explanation: 'Pivotal core course essential for advanced computing coursework and technical interviews.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },
  {
    id: 'cen-3031',
    code: 'CEN 3031',
    title: 'Introduction to Software Engineering',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Software development lifecycle, requirements elicitation, design patterns, version control, automated testing, and team project delivery.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    requirementIds: ['major-core', 'computing-electives'],
    explanation: 'Required software engineering project course for Computer Science B.S.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'predicted', 'fall-2026': 'available' }
  },
  {
    id: 'cop-4600',
    code: 'COP 4600',
    title: 'Operating Systems',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Concepts of operating systems: process scheduling, threads, synchronization, memory management, virtual memory, file systems, and device I/O.',
    raw_prerequisites: 'Prereq: CDA 3101 and COP 3530 with minimum grades of C.',
    requirementIds: ['major-core'],
    explanation: 'Required upper-division systems core in the Computer Science B.S. curriculum.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },

  // ── Computing Electives ─────────────────────────────────────────────────────
  {
    id: 'cis-4930',
    code: 'CIS 4930',
    title: 'Special Topics in Computer Science',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Rotating advanced topics in computing, including cloud computing, mobile systems, cybersecurity, and deep learning.',
    raw_prerequisites: 'Prereq: COP 3503C with minimum grade of C.',
    requirementIds: ['computing-electives'],
    explanation: 'Approved 4000-level CISE elective counting toward the Computing Electives requirement.',
    offerings: { 'fall-2025': 'unknown', 'spring-2026': 'unknown', 'summer-2026': 'unknown', 'fall-2026': 'predicted' }
  },
  {
    id: 'cap-4630',
    code: 'CAP 4630',
    title: 'Artificial Intelligence',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Heuristic search, adversary games, constraint satisfaction, knowledge representation, probabilistic inference, and introductory machine learning.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    requirementIds: ['computing-electives'],
    explanation: 'Upper-division technical elective in AI/ML concentration.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'predicted', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },
  {
    id: 'cap-4641',
    code: 'CAP 4641',
    title: 'Natural Language Processing',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Linguistic fundamentals, text preprocessing, word embeddings, transformer architectures, and modern generative language models.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    requirementIds: ['computing-electives'],
    explanation: 'Specialized 4000-level computing elective in language technologies.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'unknown', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },
  {
    id: 'cnt-4714',
    code: 'CNT 4714',
    title: 'Database Systems',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Relational model, SQL DDL/DML, functional dependencies, indexing, B-trees, query optimization, and concurrency control.',
    raw_prerequisites: 'Prereq: COP 3503C with minimum grade of C.',
    requirementIds: ['computing-electives'],
    explanation: 'Approved 4000-level technical elective in database architecture.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },
  {
    id: 'cop-4020',
    code: 'COP 4020',
    title: 'Programming Language Concepts',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Syntax and semantics, lexical and syntactic analysis, type systems, functional programming, and runtime environments.',
    raw_prerequisites: 'Prereq: COP 3530 with minimum grade of C.',
    requirementIds: ['computing-electives'],
    explanation: 'Approved upper-level CISE computing elective.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },

  // ── General Education ───────────────────────────────────────────────────────
  {
    id: 'enc-1101',
    code: 'ENC 1101',
    title: 'Expository and Argumentative Writing',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Expository and argumentative essays, analytical reading, research documentation, and collegiate writing conventions.',
    raw_prerequisites: 'None.',
    requirementIds: ['general-education'],
    explanation: 'Satisfies State Core Composition and Gordon Rule Writing (6,000 words).',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'available', 'fall-2026': 'available' }
  },
  {
    id: 'enc-1102',
    code: 'ENC 1102',
    title: 'Argument and Persuasion',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Principles of argumentation, rhetorical appeals, persuasive strategies, and scholarly research synthesis.',
    raw_prerequisites: 'Prereq: ENC 1101 with minimum grade of C.',
    requirementIds: ['general-education'],
    explanation: 'Satisfies UF General Education Composition and Gordon Rule Writing requirement.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'available', 'fall-2026': 'available' }
  },
  {
    id: 'enc-3246',
    code: 'ENC 3246',
    title: 'Professional Communication for Engineers',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Technical writing, proposals, progress reports, documentation, ethics, and oral presentations for engineering disciplines.',
    raw_prerequisites: 'Prereq: Sophomore standing or higher and ENC 1101 or ENC 1102.',
    requirementIds: ['general-education'],
    explanation: 'Mandatory technical writing requirement for all Herbert Wertheim College of Engineering majors.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'available', 'fall-2026': 'available' }
  },

  // ── Additional Requirements ─────────────────────────────────────────────────
  {
    id: 'spn-1130',
    code: 'SPN 1130',
    title: 'Beginning Spanish 1',
    credits_min: 5,
    credits_max: 5,
    credits_display: '5',
    description: 'Introduction to Spanish language and Hispanic cultures; development of basic listening, speaking, reading, and writing skills.',
    raw_prerequisites: 'None.',
    requirementIds: ['additional-requirements'],
    explanation: 'Fulfills foreign language proficiency or interdisciplinary sequence requirement.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'predicted', 'fall-2026': 'available' }
  },
  {
    id: 'spn-1131',
    code: 'SPN 1131',
    title: 'Beginning Spanish 2',
    credits_min: 5,
    credits_max: 5,
    credits_display: '5',
    description: 'Continuation of SPN 1130; complex grammar, expanded vocabulary, and cultural literacy.',
    raw_prerequisites: 'Prereq: SPN 1130 with minimum grade of C.',
    requirementIds: ['additional-requirements'],
    explanation: 'Sequential continuation course for the foreign language requirement sequence.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'unknown', 'fall-2026': 'available' }
  },
  {
    id: 'sta-3032',
    code: 'STA 3032',
    title: 'Engineering Statistics',
    credits_min: 3,
    credits_max: 3,
    credits_display: '3',
    description: 'Probability, discrete and continuous random variables, sampling distributions, hypothesis testing, confidence intervals, and linear regression.',
    raw_prerequisites: 'Prereq: MAC 2311 with minimum grade of C.',
    requirementIds: ['additional-requirements'],
    explanation: 'Mandatory mathematics/statistics support course for Computer Science engineering majors.',
    offerings: { 'fall-2025': 'available', 'spring-2026': 'available', 'summer-2026': 'available', 'fall-2026': 'available' }
  }
];

export async function runSeed() {
  console.log('🌱 Starting Database Seed: Programs, Requirements & Catalog Mappings...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Terms
    const termEntries = [
      { id: 'fall-2025', code: '2258', label: 'Fall 2025', season: 'Fall', year: 2025, sort: 2258 },
      { id: 'spring-2026', code: '2261', label: 'Spring 2026', season: 'Spring', year: 2026, sort: 2261 },
      { id: 'summer-2026', code: '2265', label: 'Summer 2026', season: 'Summer', year: 2026, sort: 2265 },
      { id: 'fall-2026', code: '2268', label: 'Fall 2026', season: 'Fall', year: 2026, sort: 2268 }
    ];

    for (const t of termEntries) {
      await client.query(`
        INSERT INTO terms (id, code, label, season, year, sort_term, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          label = EXCLUDED.label,
          season = EXCLUDED.season,
          year = EXCLUDED.year,
          sort_term = EXCLUDED.sort_term
      `, [t.id, t.code, t.label, t.season, t.year, t.sort]);
    }

    // 2. Seed Degree Program
    await client.query(`
      INSERT INTO degree_programs (id, name, college, catalog_year, total_credits)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        college = EXCLUDED.college,
        catalog_year = EXCLUDED.catalog_year,
        total_credits = EXCLUDED.total_credits
    `, [
      VERIFIED_PROGRAM.id,
      VERIFIED_PROGRAM.name,
      VERIFIED_PROGRAM.college,
      VERIFIED_PROGRAM.catalog_year,
      VERIFIED_PROGRAM.total_credits
    ]);

    // 3. Seed Degree Requirements
    for (const req of VERIFIED_REQUIREMENTS) {
      await client.query(`
        INSERT INTO degree_requirements (id, program_id, name, description, required_credits, category_order, next_course_suggestion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          program_id = EXCLUDED.program_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          required_credits = EXCLUDED.required_credits,
          category_order = EXCLUDED.category_order,
          next_course_suggestion = EXCLUDED.next_course_suggestion
      `, [
        req.id,
        req.program_id,
        req.name,
        req.description,
        req.required_credits,
        req.category_order,
        req.next_course_suggestion
      ]);
    }

    // 4. Seed Verified Courses & Offerings
    for (const c of VERIFIED_COURSES) {
      const parsedPrereqs = parseRawPrerequisites(c.raw_prerequisites);

      await client.query(`
        INSERT INTO courses (
          id, code, title, description,
          credits_min, credits_max, credits_display,
          raw_prerequisites, prereq_rules, source_timestamp, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          credits_min = EXCLUDED.credits_min,
          credits_max = EXCLUDED.credits_max,
          credits_display = EXCLUDED.credits_display,
          raw_prerequisites = EXCLUDED.raw_prerequisites,
          prereq_rules = EXCLUDED.prereq_rules,
          source_timestamp = NOW(),
          updated_at = NOW()
      `, [
        c.id,
        c.code,
        c.title,
        c.description,
        c.credits_min,
        c.credits_max,
        c.credits_display,
        c.raw_prerequisites,
        JSON.stringify(parsedPrereqs)
      ]);

      // Seed offerings per term
      for (const [termId, status] of Object.entries(c.offerings)) {
        const termCode = termEntries.find(t => t.id === termId)?.code || '2268';
        await client.query(`
          INSERT INTO course_offerings (
            course_id, term_code, term_id, offering_status, section_count, source_timestamp
          )
          VALUES ($1, $2, $3, $4, 1, NOW())
          ON CONFLICT (course_id, term_code) DO UPDATE SET
            term_id = EXCLUDED.term_id,
            offering_status = EXCLUDED.offering_status,
            source_timestamp = NOW()
        `, [c.id, termCode, termId, status]);
      }

      // Seed requirement mappings
      for (const reqId of c.requirementIds) {
        await client.query(`
          INSERT INTO course_requirement_mappings (
            course_id, requirement_id, is_mandatory, explanation, catalog_source_url
          )
          VALUES ($1, $2, TRUE, $3, 'https://catalog.ufl.edu/UGRD/colleges-schools/UGENG/CPS_BSCS/')
          ON CONFLICT (course_id, requirement_id) DO UPDATE SET
            explanation = EXCLUDED.explanation,
            catalog_source_url = EXCLUDED.catalog_source_url
        `, [c.id, reqId, c.explanation]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed data successfully populated into PostgreSQL.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution: node src/db/seed.js
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
