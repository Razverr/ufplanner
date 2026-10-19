import { useMemo, useState } from 'react'
import Requirements from './components/Requirements'
import CourseSearch from './components/CourseSearch'
import {
  courses as initialCourses,
  degreeRequirements,
  semesters as initialSemesters,
} from './data/mockdata'
import './App.css'

// Zachary Allarey Code Section
// planner imports
import SemesterPlanner from './components/SemesterPlanner'
import { deriveRequirementCredits, nextSemester } from './utils/planner'

function App() {
  const [selectedRequirementId, setSelectedRequirementId] = useState(
    'computing-electives',
  )
  const [selectedSemesterId, setSelectedSemesterId] = useState('fall-2026')

  // Zachary Allarey Code Section
  // plan state lives here so all three panels stay in sync
  const [courseList, setCourseList] = useState(initialCourses)
  const [semesterList, setSemesterList] = useState(initialSemesters)

  // requirement credits update whenever the plan changes
  const requirements = useMemo(
    () => deriveRequirementCredits(degreeRequirements, courseList),
    [courseList],
  )

  // moves a course to a semester, semesterId = null removes it from the plan
  // completed courses can't be moved
  function moveCourse(courseId, semesterId) {
    setCourseList((prev) =>
      prev.map((course) => {
        if (course.id !== courseId || course.academicStatus === 'completed') {
          return course
        }
        return semesterId
          ? { ...course, academicStatus: 'planned', plannedSemester: semesterId }
          : { ...course, academicStatus: 'not-planned', plannedSemester: null }
      }),
    )
  }

  // adds the next semester after the last one
  function addSemester() {
    setSemesterList((prev) => {
      const next = nextSemester(prev[prev.length - 1])
      return prev.some((s) => s.id === next.id) ? prev : [...prev, next]
    })
  }
  // end Zachary Allarey Code Section

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-name">UF Planner</p>
          <h1>Computer Science, B.S.</h1>
        </div>
        <span className="student-year">Current Plan</span>
      </header>

      <div className="panel-layout">
        <Requirements
          // Zachary Allarey Code Section
          // uses recalculated credits instead of the static mock data
          requirements={requirements}
          selectedRequirementId={selectedRequirementId}
          onSelectRequirement={setSelectedRequirementId}
        />

        <CourseSearch
          selectedRequirementId={selectedRequirementId}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
          // Zachary Allarey Code Section
          // connects add to plan + uses the live course list
          courses={courseList}
          semesters={semesterList}
          onAddToPlan={moveCourse}
        />

        {/* Zachary Allarey Code Section */}
        {/* semester planner panel, middle column */}
        <SemesterPlanner
          courses={courseList}
          semesters={semesterList}
          startSemesterId="spring-2026"
          onMoveCourse={moveCourse}
          onAddSemester={addSemester}
        />
      </div>
    </main>
  )
}

export default App