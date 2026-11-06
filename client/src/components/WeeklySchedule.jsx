// Zachary Allarey Code Section
// weekly schedule view: pick a section for each planned course and see the week on a grid

import { useEffect, useMemo, useState } from 'react'
import { FaCalendarWeek, FaExclamationTriangle } from 'react-icons/fa'
import { fetchCourseSectionsFromApi } from '../services/api'
import { DAYS, PERIODS, describeSection, findConflicts, sectionBlocks } from '../utils/schedule'
import './WeeklySchedule.css'

// course colors, cycles if there are more courses than colors
const COLORS = ['blue', 'orange', 'teal', 'purple', 'green', 'rose']

function sectionKey(section) {
  return String(section.classNumber ?? section.sectionNumber)
}

function WeeklySchedule({ courses, semesters, initialSemesterId }) {
  const [semesterId, setSemesterId] = useState(initialSemesterId)
  // cache of fetched sections, key = "semesterId:courseId"
  const [sectionCache, setSectionCache] = useState({})
  // chosen section per course, key = "semesterId:courseId"
  const [chosen, setChosen] = useState({})

  const plannedCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.academicStatus === 'planned' && c.plannedSemester === semesterId,
      ),
    [courses, semesterId],
  )

  // only fetch sections we don't have yet
  useEffect(() => {
    let active = true
    for (const course of plannedCourses) {
      const key = `${semesterId}:${course.id}`
      if (key in sectionCache) continue
      fetchCourseSectionsFromApi(course.id, semesterId)
        .then((data) => {
          if (active) setSectionCache((prev) => ({ ...prev, [key]: data }))
        })
        .catch(() => {
          if (active) {
            setSectionCache((prev) => ({ ...prev, [key]: { source: 'none', sections: [] } }))
          }
        })
    }
    return () => {
      active = false
    }
  }, [plannedCourses, semesterId, sectionCache])

  // each planned course with its sections and current pick
  const rows = plannedCourses.map((course, index) => {
    const key = `${semesterId}:${course.id}`
    const data = sectionCache[key]
    const sections = data?.sections || []
    // default to the first section that has meeting times
    const fallback = sections.find((s) => sectionBlocks(s).length > 0) || sections[0]
    const picked = sections.find((s) => sectionKey(s) === chosen[key]) || fallback
    return {
      course,
      key,
      loading: !data,
      source: data?.source,
      sections,
      picked,
      color: COLORS[index % COLORS.length],
    }
  })

  // every block on the grid
  const placed = rows.flatMap((row) =>
    row.picked
      ? sectionBlocks(row.picked).map((block) => ({
          ...block,
          courseId: row.course.id,
          code: row.course.code,
          color: row.color,
        }))
      : [],
  )

  const conflicts = findConflicts(placed)

  // true if this exact block overlaps a different course
  function isConflict(block) {
    return placed.some(
      (other) =>
        other.courseId !== block.courseId &&
        other.day === block.day &&
        other.start <= block.end &&
        block.start <= other.end,
    )
  }
  const noTimes = rows.filter((row) => row.picked && sectionBlocks(row.picked).length === 0)
  const usingDemo = rows.some((row) => row.source === 'demo')
  const semesterLabel = semesters.find((s) => s.id === semesterId)?.label ?? semesterId

  // splits overlapping blocks side by side so both stay readable
  function laneStyle(block) {
    const overlapping = placed.filter(
      (other) =>
        other.day === block.day && other.start <= block.end && block.start <= other.end,
    )
    const lane = overlapping.indexOf(block)
    const width = 100 / overlapping.length
    return {
      gridColumn: block.day + 2,
      gridRow: `${block.start + 2} / ${block.end + 3}`,
      width: `${width}%`,
      marginLeft: `${lane * width}%`,
    }
  }

  return (
    <section className="schedule-panel" aria-labelledby="schedule-title">
      <div className="schedule-heading">
        <div>
          <p className="section-label">Weekly view</p>
          <h2 id="schedule-title">Weekly Schedule</h2>
        </div>
        <select
          className="schedule-semester"
          aria-label="Semester to show"
          value={semesterId}
          onChange={(e) => setSemesterId(e.target.value)}
        >
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="schedule-empty">
          <FaCalendarWeek aria-hidden="true" />
          No courses planned for {semesterLabel} yet. Add some in the Semester Planner to see
          your week.
        </p>
      ) : (
        <div className="schedule-body">
          {/* section picker for each planned course */}
          <ul className="schedule-courses">
            {rows.map((row) => (
              <li key={row.key} className={`schedule-course color-${row.color}`}>
                <span className="schedule-swatch" aria-hidden="true" />
                <div className="schedule-course-name">
                  <span className="planner-code">{row.course.code}</span>
                  <span className="schedule-course-title">{row.course.title}</span>
                </div>
                {row.loading ? (
                  <span className="schedule-muted">Loading sections…</span>
                ) : row.sections.length === 0 ? (
                  <span className="schedule-muted">No sections found</span>
                ) : (
                  <select
                    aria-label={`Section for ${row.course.code}`}
                    value={row.picked ? sectionKey(row.picked) : ''}
                    onChange={(e) =>
                      setChosen((prev) => ({ ...prev, [row.key]: e.target.value }))
                    }
                  >
                    {row.sections.map((s) => (
                      <option key={sectionKey(s)} value={sectionKey(s)}>
                        {s.sectionNumber ? `Sec ${s.sectionNumber} · ` : ''}
                        {describeSection(s)}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>

          {/* conflict warnings */}
          {conflicts.length > 0 && (
            <div className="schedule-conflicts" role="status">
              {conflicts.map((c) => (
                <p key={c.ids.join('-')}>
                  <FaExclamationTriangle aria-hidden="true" />
                  {c.codes[0]} and {c.codes[1]} overlap on {c.days} at {c.period}. Try a
                  different section.
                </p>
              ))}
            </div>
          )}

          {/* weekly grid */}
          <div className="schedule-scroll">
            <div className="schedule-grid">
              <div className="schedule-corner" />
              {DAYS.map((day) => (
                <div key={day.id} className="schedule-day">
                  {day.label}
                </div>
              ))}
              {PERIODS.map((period, i) => (
                <div
                  key={period.id}
                  className="schedule-period"
                  style={{ gridRow: i + 2 }}
                >
                  <strong>{period.label}</strong>
                  <span>{period.start}</span>
                </div>
              ))}
              {/* background cells for grid lines */}
              {PERIODS.map((period, i) =>
                DAYS.map((day, d) => (
                  <div
                    key={`${period.id}-${day.id}`}
                    className="schedule-cell"
                    style={{ gridRow: i + 2, gridColumn: d + 2 }}
                  />
                )),
              )}
              {placed.map((block) => (
                <div
                  key={`${block.courseId}-${block.day}-${block.start}`}
                  className={`schedule-block color-${block.color} ${
                    isConflict(block) ? 'is-conflict' : ''
                  }`}
                  style={laneStyle(block)}
                >
                  <strong>{block.code}</strong>
                  {block.building && (
                    <span>
                      {block.building} {block.room}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* online or tba courses don't go on the grid */}
          {noTimes.length > 0 && (
            <p className="schedule-note">
              No set meeting time: {noTimes.map((row) => row.course.code).join(', ')}
            </p>
          )}
          {usingDemo && (
            <p className="schedule-note">
              Some section times are sample data because live ONE.UF section times aren't loaded
              yet.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export default WeeklySchedule