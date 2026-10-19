// Zachary Allarey Code Section
// semester planner panel: shows planned courses by semester, drag and drop, prereq + load warnings

import { useState } from 'react'
import {
  FaCheckCircle,
  FaChevronRight,
  FaExclamationTriangle,
  FaPlus,
  FaTimes,
} from 'react-icons/fa'
import { COURSE_DRAG_TYPE, getPrereqIssues } from '../utils/planner'
import './SemesterPlanner.css'

// value used in the move dropdown to remove a course
const REMOVE = '__remove'

const offeringText = {
  predicted: 'Offering predicted for this term',
  unknown: 'Offering not confirmed for this term',
}

function sumCredits(list) {
  return list.reduce((sum, course) => sum + course.credits, 0)
}

// over 18 = heavy, under 12 = below full time (summer skipped)
function loadWarning(semester, credits) {
  if (credits > 18) return 'Heavy load'
  if (credits > 0 && credits < 12 && !semester.label.startsWith('Summer')) {
    return 'Below full time'
  }
  return null
}

function SemesterPlanner({
  courses,
  semesters,
  startSemesterId,
  onMoveCourse,
  onAddSemester,
}) {
  const [dragOverId, setDragOverId] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)

  // only show semesters from startSemesterId onward
  const startIndex = Math.max(
    0,
    semesters.findIndex((s) => s.id === startSemesterId),
  )
  const visibleSemesters = semesters.slice(startIndex)
  const completedCourses = courses.filter((c) => c.academicStatus === 'completed')
  const plannedCourses = courses.filter((c) => c.academicStatus === 'planned')
  const issues = getPrereqIssues(courses, semesters)

  function handleDragOver(event, semesterId) {
    // only accept our course drags
    if (!event.dataTransfer.types.includes(COURSE_DRAG_TYPE)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (dragOverId !== semesterId) setDragOverId(semesterId)
  }

  function handleDrop(event, semesterId) {
    event.preventDefault()
    setDragOverId(null)
    const courseId = event.dataTransfer.getData(COURSE_DRAG_TYPE)
    if (courseId) onMoveCourse(courseId, semesterId)
  }

  return (
    <section className="planner-panel" aria-labelledby="planner-title">
      <div className="planner-heading">
        <div>
          <p className="section-label">Your plan</p>
          <h2 id="planner-title">Semester Planner</h2>
        </div>
        <span className="planner-summary">
          {sumCredits(plannedCourses)} credits planned
        </span>
      </div>

      <p className="planner-instructions">
        Drag courses between semesters, or use Move to on any course.
      </p>

      {/* completed courses, collapsed by default */}
      <div className="planner-completed">
        <button
          type="button"
          className="planner-completed-toggle"
          aria-expanded={showCompleted}
          aria-controls="planner-completed-list"
          onClick={() => setShowCompleted((open) => !open)}
        >
          <span className={`expand-chevron ${showCompleted ? 'open' : ''}`} aria-hidden="true">
            <FaChevronRight />
          </span>
          <FaCheckCircle className="completed-icon" aria-hidden="true" />
          Completed coursework
          <span className="planner-completed-count">
            {completedCourses.length} courses · {sumCredits(completedCourses)} credits
          </span>
        </button>
        {showCompleted && (
          <ul className="planner-completed-list" id="planner-completed-list">
            {completedCourses.map((course) => (
              <li key={course.id}>
                <span className="planner-code">{course.code}</span>
                <span>{course.title}</span>
                <span className="planner-credits">{course.credits} cr</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* semester list */}
      <ol className="planner-semesters">
        {visibleSemesters.map((semester) => {
          const semesterCourses = plannedCourses.filter(
            (c) => c.plannedSemester === semester.id,
          )
          const credits = sumCredits(semesterCourses)
          const warning = loadWarning(semester, credits)

          return (
            <li
              key={semester.id}
              className={`planner-semester ${dragOverId === semester.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, semester.id)}
              onDragLeave={(e) => {
                // ignore leave events from child elements
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null)
              }}
              onDrop={(e) => handleDrop(e, semester.id)}
            >
              <div className="planner-semester-heading">
                <h3>{semester.label}</h3>
                <span className={`planner-semester-credits ${warning ? 'warn' : ''}`}>
                  {credits} credits{warning ? ` · ${warning}` : ''}
                </span>
              </div>

              {semesterCourses.length === 0 ? (
                <p className="planner-empty">
                  Drag a course here, or choose this semester in Course Discovery
                  and select Add.
                </p>
              ) : (
                <ul className="planner-courses">
                  {semesterCourses.map((course) => {
                    const missing = issues[course.id]
                    const offering = course.offerings[semester.id] ?? 'unknown'

                    return (
                      <li
                        key={course.id}
                        className={`planner-course ${missing ? 'has-issue' : ''}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(COURSE_DRAG_TYPE, course.id)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragEnd={() => setDragOverId(null)}
                      >
                        <div className="planner-course-row">
                          <div className="planner-course-name">
                            <span className="planner-code">{course.code}</span>
                            <span className="planner-title">{course.title}</span>
                          </div>
                          <div className="planner-course-actions">
                            <span className="planner-credits">{course.credits} cr</span>
                            {/* move dropdown, keyboard-friendly option besides dragging */}
                            <select
                              aria-label={`Move ${course.code} to another semester`}
                              value=""
                              onChange={(e) =>
                                onMoveCourse(
                                  course.id,
                                  e.target.value === REMOVE ? null : e.target.value,
                                )
                              }
                            >
                              <option value="" disabled>
                                Move to
                              </option>
                              {visibleSemesters
                                .filter((s) => s.id !== semester.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              <option value={REMOVE}>Remove from plan</option>
                            </select>
                            <button
                              type="button"
                              className="planner-remove"
                              aria-label={`Remove ${course.code} from plan`}
                              title="Remove from plan"
                              onClick={() => onMoveCourse(course.id, null)}
                            >
                              <FaTimes aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {/* prereq warning */}
                        {missing && (
                          <p className="planner-warning">
                            <FaExclamationTriangle aria-hidden="true" />
                            Plan {missing.join(' and ')} in an earlier semester first.
                          </p>
                        )}
                        {/* offering not confirmed for this term */}
                        {offering !== 'available' && (
                          <p className="planner-note">{offeringText[offering]}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ol>

      <button type="button" className="planner-add-semester" onClick={onAddSemester}>
        <FaPlus aria-hidden="true" />
        Add semester
      </button>
    </section>
  )
}

export default SemesterPlanner