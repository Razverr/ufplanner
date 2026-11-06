/**
 * ONE.UF Schedule of Courses & Catalog Importer
 * 
 * Interacts with public ONE.UF SOC APIs:
 *   - https://one.uf.edu/apix/soc/filters
 *   - https://one.uf.edu/apix/soc/schedule/
 * 
 * Features:
 *   - Configurable scope (full university --all, or specific course prefixes)
 *   - High-performance multi-row batch upserts
 *   - Reliable pagination via LASTCONTROLNUMBER
 *   - Data sanitization (strips malformed/phantom courses)
 *   - Verbatim raw prerequisites and structured parsing
 *   - Accurate variable credits handling
 *   - Source timestamps and audit logging
 */

import { pool } from '../db/pool.js';
import { parseRawPrerequisites } from '../utils/prereqs.js';

const SOC_BASE_URL = 'https://one.uf.edu/apix/soc/schedule/';
const FILTERS_URL = 'https://one.uf.edu/apix/soc/filters';

// Default scope: Key departments & prefixes supporting Computer Science B.S. curriculum
export const DEFAULT_IMPORT_SCOPE = {
  category: 'CWSP',
  // Historical, current, and upcoming terms
  termCodes: ['2258', '2261', '2265', '2268'],
  // CISE Department + relevant cross-department course prefixes
  deptCodes: ['19140000'],
  coursePrefixes: ['COP', 'CDA', 'COT', 'CAP', 'CEN', 'CNT', 'CIS', 'MAC', 'PHY', 'ENC', 'SPN', 'STA', 'EEL'],
  allCourses: false
};

/**
 * Fetch filters metadata from ONE.UF
 */
export async function fetchSocFilters() {
  try {
    const res = await fetch(FILTERS_URL);
    if (!res.ok) throw new Error(`Filters API responded with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('⚠️ Could not fetch ONE.UF filters:', err.message);
    return null;
  }
}

/**
 * Fetch a single page from ONE.UF schedule endpoint
 */
async function fetchSchedulePage(params, maxRetries = 3) {
  const url = new URL(SOC_BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, v);
    }
  }

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const res = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json', 'User-Agent': 'UFPlanner-Importer/1.0' }
      });

      if (!res.ok) {
        throw new Error(`Schedule API HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      const backoffMs = attempt * 800;
      console.warn(`[Retry ${attempt}/${maxRetries}] error: ${err.message}. Waiting ${backoffMs}ms...`);
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }
}

/**
 * Convert term code to stable semester ID (e.g., '2268' -> 'fall-2026')
 */
export function termCodeToSemesterId(termCode) {
  const termStr = String(termCode);
  const prefix = termStr.substring(0, 3); // '226' -> 2026
  const semDigit = termStr.charAt(3);    // '1' = Spring, '5' = Summer, '8' = Fall
  const year = 2000 + parseInt(prefix.substring(1), 10);

  const seasonMap = {
    '1': 'spring',
    '5': 'summer',
    '8': 'fall'
  };

  const season = seasonMap[semDigit] || 'term';
  return `${season}-${year}`;
}

export function termCodeToLabel(termCode) {
  const termStr = String(termCode);
  const prefix = termStr.substring(0, 3);
  const semDigit = termStr.charAt(3);
  const year = 2000 + parseInt(prefix.substring(1), 10);

  const labelMap = {
    '1': `Spring ${year}`,
    '5': `Summer ${year}`,
    '8': `Fall ${year}`
  };
  return labelMap[semDigit] || `Term ${termCode}`;
}

/**
 * Normalize course code to lower-kebab ID (e.g. 'COP3530' -> 'cop-3530', 'MAC 2311' -> 'mac-2311')
 */
export function normalizeCourseId(code) {
  const clean = (code || '').trim().toUpperCase();
  const match = clean.match(/^([A-Z]{3})\s*(\d{4}[A-Z]?)$/);
  if (match) {
    return `${match[1].toLowerCase()}-${match[2].toLowerCase()}`;
  }
  return clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Format course code to standard display (e.g. 'COP3530' -> 'COP 3530')
 */
export function formatDisplayCode(code) {
  const clean = (code || '').trim().toUpperCase();
  const match = clean.match(/^([A-Z]{3})\s*(\d{4}[A-Z]?)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return clean;
}

/**
 * Upsert terms into PostgreSQL
 */
export async function syncTerms(client, termCodes) {
  for (const termCode of termCodes) {
    const semId = termCodeToSemesterId(termCode);
    const label = termCodeToLabel(termCode);
    const semDigit = String(termCode).charAt(3);
    const season = semDigit === '1' ? 'Spring' : semDigit === '5' ? 'Summer' : 'Fall';
    const year = 2000 + parseInt(String(termCode).substring(1, 3), 10);
    const sortTerm = parseInt(termCode, 10);

    await client.query(`
      INSERT INTO terms (id, code, label, season, year, sort_term, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        label = EXCLUDED.label,
        season = EXCLUDED.season,
        year = EXCLUDED.year,
        sort_term = EXCLUDED.sort_term,
        is_active = TRUE
    `, [semId, termCode, label, season, year, sortTerm]);
  }
}

/**
 * High-performance batch upsert for courses
 */
async function upsertCoursesBatch(client, coursesList) {
  if (!coursesList || coursesList.length === 0) return;

  // Deduplicate by course id within batch to prevent PostgreSQL ON CONFLICT error
  const uniqueMap = new Map();
  for (const c of coursesList) {
    uniqueMap.set(c.courseId, c);
  }
  const uniqueCourses = Array.from(uniqueMap.values());

  const values = [];
  const params = [];
  let pIdx = 1;

  for (const c of uniqueCourses) {
    values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, NOW(), NOW())`);
    params.push(
      c.courseId,
      c.displayCode,
      c.rawCourseId || null,
      c.title,
      c.description,
      c.credMin,
      c.credMax,
      c.credDisplay,
      c.deptCode,
      c.deptName,
      c.rawPrereqs,
      JSON.stringify(c.parsedPrereqs)
    );
  }

  const sql = `
    INSERT INTO courses (
      id, code, course_id, title, description,
      credits_min, credits_max, credits_display,
      dept_code, dept_name, raw_prerequisites, prereq_rules,
      source_timestamp, updated_at
    )
    VALUES ${values.join(',\n')}
    ON CONFLICT (id) DO UPDATE SET
      code = EXCLUDED.code,
      course_id = COALESCE(EXCLUDED.course_id, courses.course_id),
      title = EXCLUDED.title,
      description = CASE WHEN EXCLUDED.description <> '' THEN EXCLUDED.description ELSE courses.description END,
      credits_min = EXCLUDED.credits_min,
      credits_max = EXCLUDED.credits_max,
      credits_display = EXCLUDED.credits_display,
      dept_code = COALESCE(EXCLUDED.dept_code, courses.dept_code),
      dept_name = COALESCE(EXCLUDED.dept_name, courses.dept_name),
      raw_prerequisites = CASE WHEN EXCLUDED.raw_prerequisites <> '' THEN EXCLUDED.raw_prerequisites ELSE courses.raw_prerequisites END,
      prereq_rules = EXCLUDED.prereq_rules,
      source_timestamp = NOW(),
      updated_at = NOW()
  `;

  await client.query(sql, params);
}

/**
 * High-performance batch upsert for offerings
 */
async function upsertOfferingsBatch(client, offeringsList) {
  if (!offeringsList || offeringsList.length === 0) return;

  const uniqueMap = new Map();
  for (const o of offeringsList) {
    uniqueMap.set(`${o.courseId}:${o.termCode}`, o);
  }
  const uniqueOfferings = Array.from(uniqueMap.values());

  const values = [];
  const params = [];
  let pIdx = 1;

  for (const o of uniqueOfferings) {
    values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, 'available', $${pIdx++}, $${pIdx++}, NOW())`);
    params.push(
      o.courseId,
      o.termCode,
      o.termId,
      o.sectionCount,
      JSON.stringify(o.sectionsSummary)
    );
  }

  const sql = `
    INSERT INTO course_offerings (
      course_id, term_code, term_id, offering_status, section_count, sections_data, source_timestamp
    )
    VALUES ${values.join(',\n')}
    ON CONFLICT (course_id, term_code) DO UPDATE SET
      term_id = EXCLUDED.term_id,
      offering_status = 'available',
      section_count = EXCLUDED.section_count,
      sections_data = EXCLUDED.sections_data,
      source_timestamp = NOW()
  `;

  await client.query(sql, params);
}

/**
 * Process a page of ONE.UF courses
 */
async function processCoursePage(client, rawCourses, termCode, termId, seenCourses) {
  const coursesToUpsert = [];
  const offeringsToUpsert = [];

  for (const rawCourse of rawCourses) {
    const rawCode = (rawCourse.code || '').trim();
    // Validate course code to discard empty or phantom records
    if (!rawCode || rawCode === '0000' || rawCode.length < 3) {
      continue;
    }

    const courseId = normalizeCourseId(rawCode);
    const displayCode = formatDisplayCode(rawCode);
    const title = (rawCourse.name || displayCode).trim();
    const description = (rawCourse.description || '').trim();
    const rawPrereqs = (rawCourse.prerequisites || '').trim();
    const parsedPrereqs = parseRawPrerequisites(rawPrereqs);

    // Determine credits
    let credMin = 3.0;
    let credMax = 3.0;
    let credDisplay = '3';

    if (rawCourse.sections && rawCourse.sections.length > 0) {
      const firstSec = rawCourse.sections[0];
      if (firstSec.credits_min !== undefined && firstSec.credits_max !== undefined) {
        credMin = Number(firstSec.credits_min);
        credMax = Number(firstSec.credits_max);
        credDisplay = credMin === credMax ? `${credMin}` : `${credMin}–${credMax}`;
      } else if (firstSec.credits !== undefined) {
        credMin = Number(firstSec.credits);
        credMax = credMin;
        credDisplay = `${credMin}`;
      }
    }

    const deptCode = rawCourse.sections?.[0]?.deptCode ? String(rawCourse.sections[0].deptCode) : null;
    const deptName = rawCourse.sections?.[0]?.deptName || null;

    coursesToUpsert.push({
      courseId,
      displayCode,
      rawCourseId: rawCourse.courseId,
      title,
      description,
      credMin,
      credMax,
      credDisplay,
      deptCode,
      deptName,
      rawPrereqs,
      parsedPrereqs
    });

    seenCourses.set(courseId, true);

    const sectionCount = rawCourse.sections ? rawCourse.sections.length : 0;
        const sectionsSummary = (rawCourse.sections || []).map(s => ({
      classNumber: s.classNumber,
      sectionNumber: s.number,
      instructors: (s.instructors || []).map(i => i.name).filter(Boolean),
      credits: s.credits,
      openSeats: s.openSeats,
      // Zachary Allarey Code Section
      // keep meeting days/times for the weekly schedule
      meetTimes: (s.meetTimes || []).map(m => ({
        days: m.meetDays || [],
        periodBegin: m.meetPeriodBegin ?? null,
        periodEnd: m.meetPeriodEnd ?? null,
        timeBegin: m.meetTimeBegin ?? null,
        timeEnd: m.meetTimeEnd ?? null,
        building: m.meetBuilding || m.meetBldgCode || null,
        room: m.meetRoom || null
      }))
    }));

    offeringsToUpsert.push({
      courseId,
      termCode,
      termId,
      sectionCount,
      sectionsSummary
    });
  }

  if (coursesToUpsert.length > 0) {
    await upsertCoursesBatch(client, coursesToUpsert);
  }
  if (offeringsToUpsert.length > 0) {
    await upsertOfferingsBatch(client, offeringsToUpsert);
  }

  return offeringsToUpsert.length;
}

/**
 * Run a full import pass for a specified scope
 */
export async function runImport(scope = DEFAULT_IMPORT_SCOPE) {
  const client = await pool.connect();
  const startTime = new Date();
  let totalCoursesImported = 0;
  let totalOfferingsImported = 0;

  const isAll = Boolean(scope.allCourses || !scope.coursePrefixes || scope.coursePrefixes.length === 0);

  console.log('🚀 Starting ONE.UF Schedule & Catalog Import...');
  console.log(`📋 Scope: Terms [${scope.termCodes.join(', ')}], Mode: ${isAll ? 'ALL UNIVERSITY COURSES' : `Prefixes [${scope.coursePrefixes.join(', ')}]`}`);

  // Start audit log
  const logRes = await client.query(`
    INSERT INTO import_logs (scope, term_codes, status, started_at)
    VALUES ($1, $2, 'in_progress', $3)
    RETURNING id
  `, [JSON.stringify(scope), scope.termCodes, startTime]);
  const logId = logRes.rows[0].id;

  try {
    await client.query('BEGIN');
    await syncTerms(client, scope.termCodes);

    // Map of unique courses to track across terms
    const seenCourses = new Map();

    for (const termCode of scope.termCodes) {
      const termId = termCodeToSemesterId(termCode);
      const termLabel = termCodeToLabel(termCode);
      console.log(`\n📅 Importing term: ${termCode} (${termLabel})...`);

      if (isAll) {
        // Stream all courses from A to Z across the entire university
        let lastControlNumber = 0;
        let hasMore = true;
        let pageCount = 0;
        let termRetrieved = 0;

        while (hasMore) {
          pageCount++;
          const pageData = await fetchSchedulePage({
            category: scope.category || 'CWSP',
            term: termCode,
            'last-control-number': lastControlNumber
          });

          if (!pageData || !pageData.COURSES || pageData.COURSES.length === 0) {
            hasMore = false;
            break;
          }

          const pageRetrieved = pageData.COURSES.length;
          const totalInSoc = Number(pageData.TOTALROWS || 0);
          const nextControl = Number(pageData.LASTCONTROLNUMBER || 0);

          const insertedOfferings = await processCoursePage(client, pageData.COURSES, termCode, termId, seenCourses);
          totalOfferingsImported += insertedOfferings;
          termRetrieved += pageRetrieved;

          process.stdout.write(`\r   📄 Page ${pageCount} | Processed ${termRetrieved}/${totalInSoc} courses (Ctrl #${nextControl})`);

          if (pageRetrieved === 0 || nextControl === 0 || nextControl === lastControlNumber || (totalInSoc > 0 && termRetrieved >= totalInSoc)) {
            hasMore = false;
          } else {
            lastControlNumber = nextControl;
          }

          // Gentle throttle
          await new Promise(r => setTimeout(r, 60));
        }
        console.log(`\n   ✅ Term ${termLabel} complete: ${termRetrieved} courses processed.`);
      } else {
        // Scoped prefixes import
        for (const prefix of scope.coursePrefixes) {
          let lastControlNumber = 0;
          let hasMore = true;
          let pageCount = 0;

          while (hasMore) {
            pageCount++;
            const pageData = await fetchSchedulePage({
              category: scope.category || 'CWSP',
              term: termCode,
              'course-code': prefix.toLowerCase(),
              'last-control-number': lastControlNumber
            });

            if (!pageData || !pageData.COURSES || pageData.COURSES.length === 0) {
              hasMore = false;
              break;
            }

            const pageRetrieved = pageData.COURSES.length;
            const totalInSoc = Number(pageData.TOTALROWS || 0);
            const nextControl = Number(pageData.LASTCONTROLNUMBER || 0);

            const insertedOfferings = await processCoursePage(client, pageData.COURSES, termCode, termId, seenCourses);
            totalOfferingsImported += insertedOfferings;

            if (pageRetrieved === 0 || nextControl === 0 || nextControl === lastControlNumber) {
              hasMore = false;
            } else {
              lastControlNumber = nextControl;
              if (pageCount * pageRetrieved >= totalInSoc) {
                hasMore = false;
              }
            }

            await new Promise(r => setTimeout(r, 80));
          }
        }
      }
    }

    totalCoursesImported = seenCourses.size;

    await client.query('COMMIT');

    // Update log
    await client.query(`
      UPDATE import_logs SET
        courses_imported = $1,
        offerings_imported = $2,
        status = 'completed',
        completed_at = NOW()
      WHERE id = $3
    `, [totalCoursesImported, totalOfferingsImported, logId]);

    console.log(`\n🎉 Import Complete!`);
    console.log(`   Courses recorded: ${totalCoursesImported}`);
    console.log(`   Offerings recorded: ${totalOfferingsImported}`);

    return {
      success: true,
      coursesImported: totalCoursesImported,
      offeringsImported: totalOfferingsImported,
      durationMs: Date.now() - startTime.getTime()
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', err.message);

    await client.query(`
      UPDATE import_logs SET
        status = 'failed',
        error_message = $1,
        completed_at = NOW()
      WHERE id = $2
    `, [err.message, logId]);

    throw err;
  } finally {
    client.release();
  }
}
