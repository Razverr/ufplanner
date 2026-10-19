import { useState, useMemo, useEffect, useRef } from 'react'
import {
  FaSearch,
  FaChevronRight,
  FaCheckCircle,
  FaAdjust,
  FaRegSquare,
  FaPlusCircle,
  FaTimesCircle,
  FaFilter,
} from 'react-icons/fa'
// Zachary Allarey Code Section
// courses + semesters renamed to defaults so the live plan can be passed in as props
import {
  courses as defaultCourses,
  semesters as defaultSemesters,
  degreeRequirements,
  requirementLabels,
} from '../data/mockdata'
import { COURSE_DRAG_TYPE } from '../utils/planner'
// end Zachary Allarey Code Section
import './CourseSearch.css'

// ── Helpers ─────────────────────────────────────────────────────────

/** Status labels for academic status */
const academicStatusConfig = {
  completed: { label: 'Completed', className: 'badge-completed', Icon: FaCheckCircle },
  planned: { label: 'Planned', className: 'badge-planned', Icon: FaAdjust },
  'not-planned': { label: 'Not planned', className: 'badge-not-planned', Icon: FaRegSquare },
}

/** Status labels for offering status */
const offeringStatusConfig = {
  available: { label: 'Available', className: 'badge-available' },
  predicted: { label: 'Predicted', className: 'badge-predicted' },
  unknown: { label: 'Unknown', className: 'badge-unknown' },
}

/**
 * Check whether a single prerequisite course is satisfied before
 * the given destination semester.
 *
 * A prerequisite is satisfied if:
 *   1. The prerequisite course has academicStatus === "completed", OR
 *   2. The prerequisite course has academicStatus === "planned" and its
 *      plannedSemester comes strictly before destinationSemester in
 *      semesterOrder.
 *
 * Limitation: this prototype uses simple AND-only prerequisites.
 * OR-groups, co-requisites, and minimum-grade rules are not modeled.
 */
// Zachary Allarey Code Section
// takes courses + semesters as params so prereq checks use the live plan
function isPrereqSatisfied(prereqId, destinationSemesterId, courses, semesters) {
  const semesterOrder = semesters.map((s) => s.id)
  // end Zachary Allarey Code Section
  const prereqCourse = courses.find((c) => c.id === prereqId)
  if (!prereqCourse) return { satisfied: false, reason: 'Course not found in catalog.' }

  if (prereqCourse.academicStatus === 'completed') {
    return { satisfied: true }
  }

  if (prereqCourse.academicStatus === 'planned' && prereqCourse.plannedSemester) {
    const prereqIndex = semesterOrder.indexOf(prereqCourse.plannedSemester)
    const destIndex = semesterOrder.indexOf(destinationSemesterId)
    if (prereqIndex >= 0 && destIndex >= 0 && prereqIndex < destIndex) {
      return { satisfied: true }
    }
    if (prereqIndex >= destIndex) {
      return {
        satisfied: false,
        reason: `${prereqCourse.code} is planned for ${
          semesters.find((s) => s.id === prereqCourse.plannedSemester)?.label ?? prereqCourse.plannedSemester
        }, which is not before the destination semester.`,
      }
    }
  }

  return {
    satisfied: false,
    reason: `${prereqCourse.code} is not completed or planned in an earlier semester.`,
  }
}

// Zachary Allarey Code Section
// passes courses + semesters through to the prereq check
function areAllPrereqsSatisfied(course, destinationSemesterId, courses, semesters) {
  if (course.prerequisites.length === 0) return { allMet: true, results: [] }

  const results = course.prerequisites.map((prereqId) => {
    const prereqCourse = courses.find((c) => c.id === prereqId)
    return {
      prereqId,
      code: prereqCourse?.code ?? prereqId,
      ...isPrereqSatisfied(prereqId, destinationSemesterId, courses, semesters),
    }
  })

  return { allMet: results.every((r) => r.satisfied), results }
}
// end Zachary Allarey Code Section

// ── Component ───────────────────────────────────────────────────────

function CourseSearch({
  // Zachary Allarey Code Section
  // live plan data + add to plan handler from App.jsx
  courses = defaultCourses,
  semesters = defaultSemesters,
  onAddToPlan,
  // end Zachary Allarey Code Section
  selectedRequirementId,
  selectedSemesterId,
  onSemesterChange,
}) {
  const [searchText, setSearchText] = useState('')
  const [requirementFilter, setRequirementFilter] = useState(selectedRequirementId ?? '')
  const [semesterFilter, setSemesterFilter] = useState(selectedSemesterId ?? 'fall-2026')
  const [expandedCourseId, setExpandedCourseId] = useState(null)

  // Sync incoming requirement selection from the Requirements panel
  const prevReqRef = useRef(selectedRequirementId)
  useEffect(() => {
    if (selectedRequirementId !== prevReqRef.current) {
      setRequirementFilter(selectedRequirementId ?? '')
      prevReqRef.current = selectedRequirementId
    }
  }, [selectedRequirementId])

  // ── Filtering ──────────────────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Text search (case-insensitive)
      if (searchText) {
        const q = searchText.toLowerCase()
        const matchesCode = course.code.toLowerCase().includes(q)
        const matchesTitle = course.title.toLowerCase().includes(q)
        if (!matchesCode && !matchesTitle) return false
      }

      // Requirement category filter
      if (requirementFilter && !course.requirementIds.includes(requirementFilter)) {
        return false
      }

      return true
    })
    // Zachary Allarey Code Section
    // added courses so the list updates when the plan changes
  }, [courses, searchText, requirementFilter])

  // ── Determine active filters ───────────────────────────────────────
  const activeFilters = []
  if (searchText) {
    activeFilters.push({ key: 'search', label: `Search: "${searchText}"`, clear: () => setSearchText('') })
  }
  if (requirementFilter) {
    const reqName = requirementLabels[requirementFilter] ?? requirementFilter
    activeFilters.push({ key: 'req', label: reqName, clear: () => setRequirementFilter('') })
  }

  const clearAllFilters = () => {
    setSearchText('')
    setRequirementFilter('')
  }

  const hasActiveFilters = activeFilters.length > 0

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <section className="course-panel" aria-labelledby="course-panel-title">
      {/* Heading */}
      <div className="course-panel-heading">
        <div>
          <p className="section-label">Course catalog</p>
          <h2 id="course-panel-title">Course Discovery</h2>
        </div>
      </div>

      {/* Search */}
      <div className="course-search-bar">
        <FaSearch className="search-icon" aria-hidden="true" />
        <input
          id="course-search-input"
          type="search"
          placeholder="Search by course code or title…"
          aria-label="Search courses by code or title"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="course-filters">
        <select
          aria-label="Filter by requirement category"
          value={requirementFilter}
          onChange={(e) => setRequirementFilter(e.target.value)}
        >
          <option value="">All requirements</option>
          {degreeRequirements.map((req) => (
            <option key={req.id} value={req.id}>
              {req.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Select semester for offering status"
          value={semesterFilter}
          onChange={(e) => {
            setSemesterFilter(e.target.value)
            onSemesterChange?.(e.target.value)
          }}
        >
          {semesters.map((sem) => (
            <option key={sem.id} value={sem.id}>
              {sem.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter tags + result count */}
      <div className="filter-status-bar" aria-live="polite">
        {activeFilters.map((f) => (
          <button
            key={f.key}
            className="active-filter-tag"
            onClick={f.clear}
            aria-label={`Remove filter: ${f.label}`}
          >
            {f.label} <FaTimesCircle aria-hidden="true" />
          </button>
        ))}
        {hasActiveFilters && (
          <button className="clear-all-btn" onClick={clearAllFilters}>
            Clear all
          </button>
        )}
        <span className="result-count">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Course list or empty state */}
      {filteredCourses.length === 0 ? (
        <div className="course-empty-state" role="status">
          <div className="empty-icon" aria-hidden="true">
            <FaFilter />
          </div>
          <h3>No matching courses</h3>
          <p>
            No courses match your current search and filter criteria. Try adjusting your search
            text or selecting a different requirement category.
          </p>
          {hasActiveFilters && (
            <button className="empty-clear-btn" onClick={clearAllFilters}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="course-list" role="list">
          {filteredCourses.map((course) => {
            const academic = academicStatusConfig[course.academicStatus]
            const AcademicIcon = academic.Icon
            const offering = course.offerings[semesterFilter]
            const offeringConf = offeringStatusConfig[offering] ?? offeringStatusConfig.unknown
            const isExpanded = expandedCourseId === course.id

            // Zachary Allarey Code Section
            // prereq check uses the live plan
            const prereqCheck = areAllPrereqsSatisfied(course, semesterFilter, courses, semesters)
            const semesterLabel =
              semesters.find((s) => s.id === semesterFilter)?.label ?? semesterFilter
            // button label says exactly where the course goes
            const isCompleted = course.academicStatus === 'completed'
            const isInSelectedSemester =
              course.academicStatus === 'planned' && course.plannedSemester === semesterFilter
            const addLabel = isCompleted
              ? 'Completed'
              : isInSelectedSemester
                ? 'In plan'
                : course.academicStatus === 'planned'
                  ? `Move to ${semesterLabel}`
                  : `Add to ${semesterLabel}`
            // end Zachary Allarey Code Section

            return (
              // Zachary Allarey Code Section
              // card can be dragged into the semester planner (not completed courses)
              <div
                className="course-card"
                key={course.id}
                role="listitem"
                draggable={!isCompleted}
                onDragStart={(e) => {
                  e.dataTransfer.setData(COURSE_DRAG_TYPE, course.id)
                  e.dataTransfer.effectAllowed = 'move'
                }}
              >
                {/* Header row with prominent Add to Plan */}
                <div className="course-card-header">
                  <div className="course-card-title">
                    <div className="course-code-row">
                      <span className="course-code">{course.code}</span>
                      <span className="course-credits">
                        {course.credits} Credits
                      </span>
                    </div>
                    <span className="course-title">{course.title}</span>
                  </div>
                  <div className="course-card-header-actions">
                    {/* Zachary Allarey Code Section */}
                    {/* add to plan now adds the course to the selected semester */}
                    <button
                      className="add-to-plan-btn"
                      disabled={isCompleted || isInSelectedSemester}
                      onClick={() => onAddToPlan?.(course.id, semesterFilter)}
                      aria-label={`${addLabel}: ${course.code}`}
                      title={`${addLabel}: ${course.code}`}
                    >
                      <FaPlusCircle aria-hidden="true" />
                      <span>{addLabel}</span>
                    </button>
                  </div>
                </div>

                {/* Status badges */}
                <div className="course-status-row">
                  <span className={`course-badge ${academic.className}`}>
                    <AcademicIcon aria-hidden="true" />
                    {academic.label}
                  </span>
                  <span className="status-separator" aria-hidden="true" />
                  <span className={`course-badge ${offeringConf.className}`}>
                    {offeringConf.label}
                    {offering === 'available' && (
                      <span className="sr-only"> (offered, but seats are not guaranteed)</span>
                    )}
                  </span>
                </div>

                {/* Requirement tags */}
                <div className="course-requirement-tags">
                  {course.requirementIds.map((rid) => (
                    <span className="requirement-tag" key={rid}>
                      {requirementLabels[rid] ?? rid}
                    </span>
                  ))}
                </div>

                {/* Expand / collapse button */}
                <button
                  className="course-expand-btn"
                  onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`details-${course.id}`}
                >
                  <span className={`expand-chevron ${isExpanded ? 'open' : ''}`} aria-hidden="true">
                    <FaChevronRight />
                  </span>
                  {isExpanded ? 'Hide details' : 'Show details'}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="course-details" id={`details-${course.id}`}>
                    {/* Description */}
                    <p className="course-description">{course.description}</p>

                    {/* Prerequisites */}
                    <div className="detail-section">
                      <span className="detail-label">Prerequisites</span>
                      {course.prerequisites.length === 0 ? (
                        <span className="detail-value">None</span>
                      ) : (
                        <div className="detail-value">
                          {prereqCheck.results.map((pr) => (
                            <div key={pr.prereqId} style={{ marginBottom: 6 }}>
                              <span>{pr.code}</span>
                              <span className={`prereq-status ${pr.satisfied ? 'prereq-met' : 'prereq-not-met'}`}>
                                {pr.satisfied ? '✓ Satisfied' : '✗ Not satisfied'}
                              </span>
                              {!pr.satisfied && pr.reason && (
                                <span className="prereq-explanation">{pr.reason}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Why it satisfies the selected requirement */}
                    {requirementFilter && course.requirementIds.includes(requirementFilter) && (
                      <div className="detail-section">
                        <span className="detail-label">Why this course matches</span>
                        <p className="requirement-reason">
                          {course.code} is listed under{' '}
                          <strong>{requirementLabels[requirementFilter]}</strong> and counts toward
                          the {course.credits}-credit requirement in that category.
                        </p>
                      </div>
                    )}

                    {/* Offering disclaimer */}
                    {offering === 'available' && (
                      <p className="offering-note">
                        <strong>Note:</strong> "Available" means this course is scheduled to be
                        offered in{' '}
                        {semesterLabel}.
                        It does not guarantee that registration seats are available.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="offering-note" style={{ marginTop: 18 }}>
        <strong>Prototype data:</strong> All courses, prerequisites, and offering statuses shown
        above are fictional and illustrative only. They do not reflect actual UF catalog data.
      </p>
    </section>
  )
}

export default CourseSearch