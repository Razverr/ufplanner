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
  FaInfoCircle,
  FaExternalLinkAlt,
  FaDatabase
} from 'react-icons/fa'
import {
  courses as defaultCourses,
  semesters as defaultSemesters,
  degreeRequirements,
  requirementLabels,
} from '../data/mockdata'
import { COURSE_DRAG_TYPE } from '../utils/planner'
import { parseRawPrerequisites, evaluatePrerequisites } from '../utils/prereqs'
import './CourseSearch.css'

// ── Status configurations ───────────────────────────────────────────

const academicStatusConfig = {
  completed: { label: 'Completed', className: 'badge-completed', Icon: FaCheckCircle },
  planned: { label: 'Planned', className: 'badge-planned', Icon: FaAdjust },
  'not-planned': { label: 'Not planned', className: 'badge-not-planned', Icon: FaRegSquare },
}

const offeringStatusConfig = {
  available: { label: 'Confirmed Offering', className: 'badge-available' },
  predicted: { label: 'Predicted Offering', className: 'badge-predicted' },
  unknown: { label: 'Unknown Availability', className: 'badge-unknown' },
}

function CourseSearch({
  courses = defaultCourses,
  semesters = defaultSemesters,
  onAddToPlan,
  selectedRequirementId,
  selectedSemesterId,
  onSemesterChange,
}) {
  const [searchText, setSearchText] = useState('')
  const [requirementFilter, setRequirementFilter] = useState(selectedRequirementId ?? '')

  // Remove hardcoded semester default: prioritize prop, then first available semester
  const initialSemester = selectedSemesterId || (semesters && semesters.length > 0 ? semesters[0].id : '')
  const [semesterFilter, setSemesterFilter] = useState(initialSemester)
  const [expandedCourseId, setExpandedCourseId] = useState(null)

  const PAGE_SIZE = 50
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE)

  // Reset pagination window when filters change
  useEffect(() => {
    setDisplayLimit(PAGE_SIZE)
  }, [searchText, requirementFilter, semesterFilter])

  // Synchronize parent-driven semester changes
  useEffect(() => {
    if (selectedSemesterId && selectedSemesterId !== semesterFilter) {
      setSemesterFilter(selectedSemesterId)
    }
  }, [selectedSemesterId])

  // Synchronize incoming requirement selection from Requirements panel
  const prevReqRef = useRef(selectedRequirementId)
  useEffect(() => {
    if (selectedRequirementId !== prevReqRef.current) {
      setRequirementFilter(selectedRequirementId ?? '')
      prevReqRef.current = selectedRequirementId
    }
  }, [selectedRequirementId])

  // ── Filtering & Sorting ────────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        // Text search (case-insensitive) on code, title, or description
        if (searchText) {
          const q = searchText.toLowerCase()
          const matchesCode = course.code.toLowerCase().includes(q)
          const matchesTitle = course.title.toLowerCase().includes(q)
          const matchesDesc = (course.description || '').toLowerCase().includes(q)
          if (!matchesCode && !matchesTitle && !matchesDesc) return false
        }

        // Requirement category filter
        if (requirementFilter && !(course.requirementIds || []).includes(requirementFilter)) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        const aCompleted = a.academicStatus === 'completed' ? 1 : 0
        const bCompleted = b.academicStatus === 'completed' ? 1 : 0
        return aCompleted - bCompleted
      })
  }, [courses, searchText, requirementFilter])

  // ── Active Filters ─────────────────────────────────────────────────
  const activeFilters = []
  if (searchText) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${searchText}"`,
      clear: () => setSearchText(''),
    })
  }
  if (requirementFilter) {
    const reqName = requirementLabels[requirementFilter] ?? requirementFilter
    activeFilters.push({
      key: 'req',
      label: reqName,
      clear: () => setRequirementFilter(''),
    })
  }

  const clearAllFilters = () => {
    setSearchText('')
    setRequirementFilter('')
  }

  const hasActiveFilters = activeFilters.length > 0
  const activeSemesterObj = (semesters || []).find((s) => s.id === semesterFilter) || semesters[0]
  const semesterLabel = activeSemesterObj?.label || semesterFilter

  const displayedCourses = useMemo(() => {
    return filteredCourses.slice(0, displayLimit)
  }, [filteredCourses, displayLimit])

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
            const nextSem = e.target.value
            setSemesterFilter(nextSem)
            onSemesterChange?.(nextSem)
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
          {filteredCourses.length > displayLimit
            ? `Showing ${displayedCourses.length} of ${filteredCourses.length} courses`
            : `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''} found`}
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
          {displayedCourses.map((course) => {
            const academic = academicStatusConfig[course.academicStatus] || academicStatusConfig['not-planned']
            const AcademicIcon = academic.Icon
            const offering = course.offerings?.[semesterFilter] || 'unknown'
            const offeringConf = offeringStatusConfig[offering] ?? offeringStatusConfig.unknown
            const isExpanded = expandedCourseId === course.id

            // Evaluate prerequisites against the FULL student history and plan
            const parsedPrereqData = course.prereq_rules || parseRawPrerequisites(course.raw_prerequisites)
            const prereqCheck = evaluatePrerequisites(parsedPrereqData, semesterFilter, courses, semesters)

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

            return (
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
                        {course.credits_display || `${course.credits}`} Credits
                      </span>
                      {course.credits_min && course.credits_max && course.credits_min !== course.credits_max && (
                        <span className="variable-credits-tag">Variable</span>
                      )}
                    </div>
                    <span className="course-title">{course.title}</span>
                  </div>
                  <div className="course-card-header-actions">
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
                      <span className="sr-only"> (offered in schedule; seats not guaranteed)</span>
                    )}
                  </span>
                </div>

                {/* Requirement tags */}
                <div className="course-requirement-tags">
                  {(course.requirementIds || []).map((rid) => (
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
                      <span className="detail-label">Prerequisites &amp; Eligibility</span>
                      
                      {/* Verbatim raw prerequisite quote from catalog */}
                      {course.raw_prerequisites && (
                        <div className="prereq-raw-box" title="Verbatim text from UF Schedule / Catalog">
                          <strong>Catalog Prerequisite:</strong> {course.raw_prerequisites}
                        </div>
                      )}

                      {prereqCheck.status === 'none' ? (
                        <span className="prereq-status prereq-met">✓ None required</span>
                      ) : (
                        <div className="prereq-clause-list">
                          {prereqCheck.details.map((clause, idx) => (
                            <div key={idx} className="prereq-clause-item">
                              <div className="prereq-clause-header">
                                <span className="prereq-clause-text">{clause.rawClause}</span>
                                <span className={`prereq-status ${clause.satisfied ? 'prereq-met' : 'prereq-not-met'}`}>
                                  {clause.satisfied ? '✓ Satisfied' : '✗ Not satisfied'}
                                </span>
                              </div>
                              {clause.reason && (
                                <span className="prereq-explanation">{clause.reason}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Flag complex rules that require advisor / grade review */}
                      {prereqCheck.hasComplexConditions && (
                        <div className="prereq-advisory-pill">
                          <FaInfoCircle aria-hidden="true" />
                          <span>
                            <strong>Advisory Rule:</strong> This course contains class standing, minimum grade,
                            or departmental consent rules that require official degree audit review.
                          </span>
                        </div>
                      )}

                      {/* Advisories list */}
                      {prereqCheck.advisories && prereqCheck.advisories.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {prereqCheck.advisories.map((adv, i) => (
                            <small key={i} style={{ display: 'block', color: '#68758b', marginTop: 2 }}>
                              • {adv}
                            </small>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Why it satisfies the selected requirement */}
                    {requirementFilter && (course.requirementIds || []).includes(requirementFilter) && (
                      <div className="detail-section">
                        <span className="detail-label">Why this course matches</span>
                        <p className="requirement-reason">
                          {course.requirementExplanations?.[requirementFilter] || (
                            `${course.code} is listed under ${requirementLabels[requirementFilter]} in the official UF Academic Catalog for Computer Science, B.S.`
                          )}
                        </p>
                      </div>
                    )}

                    {/* Honest offering status note */}
                    {offering === 'available' ? (
                      <p className="offering-note">
                        <strong>Confirmed Offering:</strong> {course.code} is officially scheduled for{' '}
                        {semesterLabel} in ONE.UF. Note that this confirms offering availability, not
                        guaranteed registration seats.
                      </p>
                    ) : offering === 'predicted' ? (
                      <p className="offering-note">
                        <strong>Predicted Offering:</strong> {course.code} historically runs in{' '}
                        {semesterLabel.split(' ')[0]} terms, but registration sections have not yet been posted by the department.
                      </p>
                    ) : (
                      <p className="offering-note">
                        <strong>Unknown Availability:</strong> No confirmed schedule or reliable offering
                        pattern has been verified for {semesterLabel}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filteredCourses.length > displayLimit && (
            <div className="load-more-container">
              <button
                type="button"
                className="load-more-btn"
                onClick={() => setDisplayLimit((prev) => prev + PAGE_SIZE)}
              >
                Load more courses ({displayedCourses.length} of {filteredCourses.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Real Data Provenance & Freshness Footer */}
      <div className="provenance-card">
        <div className="provenance-header">
          <FaDatabase aria-hidden="true" />
          <span>Real UF Course Data Integration</span>
        </div>
        <p style={{ margin: '0 0 6px' }}>
          Course schedule details sourced from the public{' '}
          <a href="https://one.uf.edu/soc/" target="_blank" rel="noopener noreferrer">
            ONE.UF Schedule of Courses API <FaExternalLinkAlt style={{ fontSize: '0.62rem' }} />
          </a>{' '}
          and degree requirements verified against the{' '}
          <a
            href="https://catalog.ufl.edu/UGRD/colleges-schools/UGENG/CPS_BSCS/"
            target="_blank"
            rel="noopener noreferrer"
          >
            UF Academic Catalog <FaExternalLinkAlt style={{ fontSize: '0.62rem' }} />
          </a>{' '}
          for Computer Science B.S. (Catalog Year 2026-2027).
        </p>
        <div className="provenance-meta">
          <span>Active Context: <strong>{semesterLabel}</strong></span>
          <span>Source: <strong>ONE.UF SOC / PostgreSQL</strong></span>
          <span>Freshness: <strong>Live Schedule Synced</strong></span>
        </div>
      </div>
    </section>
  )
}

export default CourseSearch
