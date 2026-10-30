// Zachary Allarey Code Section
// shared helpers for the semester planner, enhanced with UF prerequisite evaluator

import { parseRawPrerequisites, evaluatePrerequisites } from './prereqs'

// drag and drop type, value is a course id like "cop-3530"
export const COURSE_DRAG_TYPE = 'application/x-ufplanner-course'

// finds planned courses whose prereqs aren't done or planned earlier
// returns { courseId: ["COP 3503", ...] }
export function getPrereqIssues(courses, semesters) {
  const issues = {}

  for (const course of courses) {
    if (course.academicStatus !== 'planned' || !course.plannedSemester) continue

    if (course.raw_prerequisites || course.prereq_rules) {
      const parsed = course.prereq_rules || parseRawPrerequisites(course.raw_prerequisites)
      const evaluation = evaluatePrerequisites(parsed, course.plannedSemester, courses, semesters)
      if (!evaluation.isSatisfied) {
        const missing = []
        for (const detail of evaluation.details) {
          if (!detail.satisfied) {
            if (detail.options && detail.options.length > 0) {
              missing.push(detail.options.map((o) => o.code || o).join(' or '))
            } else if (detail.rawClause) {
              missing.push(detail.rawClause)
            } else if (detail.reason) {
              missing.push(detail.reason)
            }
          }
        }
        if (missing.length > 0) {
          issues[course.id] = missing
        }
      }
    } else if (Array.isArray(course.prerequisites) && course.prerequisites.length > 0) {
      const order = semesters.map((s) => s.id)
      const byId = Object.fromEntries(courses.map((c) => [c.id, c]))
      const destIndex = order.indexOf(course.plannedSemester)

      const missing = course.prerequisites
        .filter((prereqId) => {
          const prereq = byId[prereqId]
          if (!prereq) return true
          if (prereq.academicStatus === 'completed') return false
          if (prereq.academicStatus === 'planned') {
            return order.indexOf(prereq.plannedSemester) >= destIndex
          }
          return true
        })
        .map((prereqId) => byId[prereqId]?.code ?? prereqId)

      if (missing.length > 0) issues[course.id] = missing
    }
  }

  return issues
}

// fall 2026 -> spring 2027 -> summer 2027 -> fall 2027
export function nextSemester(lastSemester) {
  const [season, yearText] = lastSemester.label.split(' ')
  const year = Number(yearText)
  const label =
    season === 'Spring'
      ? `Summer ${year}`
      : season === 'Summer'
        ? `Fall ${year}`
        : `Spring ${year + 1}`
  return { id: label.toLowerCase().replace(' ', '-'), label }
}

// recalculates completed and planned credits so the requirements panel updates with the plan
// planned credits are capped at what's still needed
export function deriveRequirementCredits(requirements, courses) {
  return requirements.map((requirement) => {
    const matching = courses.filter((c) => (c.requirementIds || []).includes(requirement.id))
    const creditsWith = (status) =>
      matching
        .filter((c) => c.academicStatus === status)
        .reduce((sum, c) => sum + (Number(c.credits) || 3), 0)

    const completedCredits = creditsWith('completed')
    const stillNeeded = Math.max(requirement.totalCredits - completedCredits, 0)

    return {
      ...requirement,
      completedCredits,
      plannedCredits: Math.min(creditsWith('planned'), stillNeeded),
    }
  })
}
