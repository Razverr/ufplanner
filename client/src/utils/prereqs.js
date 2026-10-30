/**
 * Isomorphic Prerequisite Parser & Evaluator (Client & Server)
 */

export function parseRawPrerequisites(rawText) {
  if (!rawText || !rawText.trim()) {
    return {
      type: 'none',
      raw: '',
      hasCourses: false,
      courseCodes: [],
      isComplex: false,
      clauses: []
    };
  }

  const cleaned = rawText.trim();
  const lower = cleaned.toLowerCase();

  if (/^none\.?$/i.test(cleaned) || lower === 'prereq: none' || lower === 'prereq: none.') {
    return {
      type: 'none',
      raw: cleaned,
      hasCourses: false,
      courseCodes: [],
      isComplex: false,
      clauses: []
    };
  }

  const courseCodeRegex = /\b([A-Z]{3})\s*(\d{4}[A-Z]?)\b/gi;
  const matches = [...cleaned.matchAll(courseCodeRegex)];
  const courseCodes = [...new Set(matches.map(m => `${m[1].toUpperCase()} ${m[2].toUpperCase()}`))];

  const hasGradeRequirement = /(minimum grade|grade of|grade\s+[a-c][+-]?)/i.test(cleaned);
  const hasStandingRequirement = /(senior|junior|sophomore|freshman|graduate|post-baccalaureate)\s+(standing|status)/i.test(cleaned);
  const hasPermissionRequirement = /(instructor|department|advisor|chair)\s+(permission|approval|recommendation)/i.test(cleaned);
  const hasCorequisite = /coreq|co-requisite/i.test(cleaned);

  const isComplex = hasStandingRequirement || hasPermissionRequirement || hasCorequisite || courseCodes.length === 0;
  const clauses = splitAndClauses(cleaned);

  return {
    type: isComplex ? 'complex' : 'standard',
    raw: cleaned,
    hasCourses: courseCodes.length > 0,
    courseCodes,
    isComplex,
    hasGradeRequirement,
    hasStandingRequirement,
    hasPermissionRequirement,
    hasCorequisite,
    clauses: clauses.map(c => parseClause(c))
  };
}

function splitAndClauses(text) {
  let content = text.replace(/^(prereq|coreq|prerequisite|co-requisite):\s*/i, '');
  content = content.replace(/,\s*(all\s+)?with\s+(a\s+)?minimum\s+grade[^.]*\.?$/i, '');

  const clauses = [];
  let current = '';
  let parenDepth = 0;

  const tokens = content.split(/(\s+and\s+|\s*;\s*)/i);
  for (const token of tokens) {
    for (const char of token) {
      if (char === '(' || char === '[') parenDepth++;
      if (char === ')' || char === ']') parenDepth--;
    }
    if (parenDepth === 0 && (/^\s*and\s*$/i.test(token) || /^\s*;\s*$/.test(token))) {
      if (current.trim()) clauses.push(current.trim());
      current = '';
    } else {
      current += token;
    }
  }
  if (current.trim()) clauses.push(current.trim());
  return clauses.length > 0 ? clauses : [content];
}

function parseClause(clauseText) {
  const courseCodeRegex = /\b([A-Z]{3})\s*(\d{4}[A-Z]?)\b/gi;
  const matches = [...clauseText.matchAll(courseCodeRegex)];
  const codes = matches.map(m => `${m[1].toUpperCase()} ${m[2].toUpperCase()}`);
  const isOrGroup = /\bor\b/i.test(clauseText) && codes.length > 1;

  return {
    rawClause: clauseText.trim(),
    type: isOrGroup ? 'OR' : 'AND',
    options: codes,
    isProseOnly: codes.length === 0
  };
}

export function evaluatePrerequisites(parsedPrereqs, destinationSemesterId, allStudentCourses, semestersList) {
  if (!parsedPrereqs || parsedPrereqs.type === 'none' || !parsedPrereqs.raw) {
    return {
      status: 'none',
      isSatisfied: true,
      raw: parsedPrereqs?.raw || 'None',
      summary: 'No prerequisites required.',
      details: [],
      advisories: []
    };
  }

  const semesterOrder = (semestersList || []).map(s => s.id);
  const destIndex = semesterOrder.indexOf(destinationSemesterId);

  const norm = (code) => (code || '').replace(/[\s-]+/g, '').toLowerCase();

  const studentCourseMap = new Map();
  for (const c of (allStudentCourses || [])) {
    studentCourseMap.set(norm(c.code), c);
    studentCourseMap.set(norm(c.id), c);
  }

  function checkCourse(code) {
    const studentCourse = studentCourseMap.get(norm(code));
    if (!studentCourse) {
      return {
        code,
        satisfied: false,
        reason: `${code} is not completed or planned.`
      };
    }

    if (studentCourse.academicStatus === 'completed') {
      return {
        code,
        satisfied: true,
        reason: `${code} is completed.`
      };
    }

    if (studentCourse.academicStatus === 'planned' && studentCourse.plannedSemester) {
      const planIndex = semesterOrder.indexOf(studentCourse.plannedSemester);
      const planSemLabel = (semestersList || []).find(s => s.id === studentCourse.plannedSemester)?.label || studentCourse.plannedSemester;

      if (destIndex !== -1 && planIndex !== -1 && planIndex < destIndex) {
        return {
          code,
          satisfied: true,
          reason: `${code} is planned in ${planSemLabel} (before destination semester).`
        };
      } else if (planIndex >= destIndex) {
        return {
          code,
          satisfied: false,
          reason: `${code} is planned in ${planSemLabel}, which is not before destination semester.`
        };
      }
    }

    return {
      code,
      satisfied: false,
      reason: `${code} has not been completed or planned in an earlier term.`
    };
  }

  const clauseResults = [];
  let allClausesSatisfied = true;
  const missingExplanations = [];

  for (const clause of parsedPrereqs.clauses || []) {
    if (clause.isProseOnly) {
      clauseResults.push({
        rawClause: clause.rawClause,
        satisfied: false,
        isManualVerification: true,
        reason: `Requires advisor/department verification: "${clause.rawClause}"`
      });
      allClausesSatisfied = false;
      missingExplanations.push(clause.rawClause);
      continue;
    }

    if (clause.type === 'OR') {
      const optionChecks = clause.options.map(opt => checkCourse(opt));
      const metOption = optionChecks.find(o => o.satisfied);

      if (metOption) {
        clauseResults.push({
          rawClause: clause.rawClause,
          satisfied: true,
          matchedOption: metOption.code,
          reason: `Satisfied by ${metOption.code} (${metOption.reason})`
        });
      } else {
        allClausesSatisfied = false;
        const msg = `One of: ${clause.options.join(' or ')} required before destination semester.`;
        missingExplanations.push(msg);
        clauseResults.push({
          rawClause: clause.rawClause,
          satisfied: false,
          options: optionChecks,
          reason: msg
        });
      }
    } else {
      const checks = clause.options.map(opt => checkCourse(opt));
      const allMet = checks.every(c => c.satisfied);

      if (allMet) {
        clauseResults.push({
          rawClause: clause.rawClause,
          satisfied: true,
          reason: checks.map(c => `${c.code} is satisfied`).join(', ')
        });
      } else {
        allClausesSatisfied = false;
        const unmet = checks.filter(c => !c.satisfied);
        const reasons = unmet.map(u => u.reason).join('; ');
        missingExplanations.push(reasons);
        clauseResults.push({
          rawClause: clause.rawClause,
          satisfied: false,
          details: checks,
          reason: reasons
        });
      }
    }
  }

  const advisories = [];
  if (parsedPrereqs.hasGradeRequirement) {
    advisories.push('Course requires a minimum grade (typically C or higher) in prerequisite coursework.');
  }
  if (parsedPrereqs.hasStandingRequirement) {
    advisories.push('Course requires specific class standing (e.g. Junior or Senior standing).');
  }
  if (parsedPrereqs.hasPermissionRequirement) {
    advisories.push('Course requires instructor, department, or advisor permission.');
  }

  return {
    status: allClausesSatisfied ? 'satisfied' : 'not_satisfied',
    isSatisfied: allClausesSatisfied,
    raw: parsedPrereqs.raw,
    hasComplexConditions: parsedPrereqs.isComplex,
    summary: allClausesSatisfied
      ? 'All prerequisites are satisfied before the destination semester.'
      : `Missing prerequisite: ${missingExplanations.join(' | ')}`,
    details: clauseResults,
    advisories
  };
}
