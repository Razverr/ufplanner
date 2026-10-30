import { useMemo, useState, useEffect } from 'react'
import Requirements from './components/Requirements'
import CourseSearch from './components/CourseSearch'
import SemesterPlanner from './components/SemesterPlanner'
import {
  courses as initialCourses,
  degreeRequirements as initialRequirements,
  semesters as initialSemesters,
} from './data/mockdata'
import { deriveRequirementCredits, nextSemester } from './utils/planner'
import {
  fetchCoursesFromApi,
  fetchRequirementsFromApi,
  fetchSemestersFromApi,
} from './services/api'
import './App.css'

function App() {
  const [selectedRequirementId, setSelectedRequirementId] = useState('computing-electives')
  const [selectedSemesterId, setSelectedSemesterId] = useState('fall-2026')

  // Core plan state: courses and semesters
  const [courseList, setCourseList] = useState(initialCourses)
  const [semesterList, setSemesterList] = useState(initialSemesters)
  const [baseRequirements, setBaseRequirements] = useState(initialRequirements)
  const [programInfo, setProgramInfo] = useState({
    name: 'Computer Science, B.S.',
    college: 'Herbert Wertheim College of Engineering',
    catalogYear: '2026-2027',
  })

  // Synchronize with PERN backend when available
  useEffect(() => {
    let isMounted = true

    async function loadBackendData() {
      try {
        // Fetch verified degree requirements
        const reqData = await fetchRequirementsFromApi()
        if (isMounted && reqData?.requirements) {
          setBaseRequirements(reqData.requirements)
          if (reqData.program) {
            setProgramInfo({
              name: reqData.program.name,
              college: reqData.program.college,
              catalogYear: reqData.program.catalog_year || '2026-2027',
            })
          }
        }
      } catch (e) {
        // Fallback already in state
      }

      try {
        // Fetch active semesters
        const semData = await fetchSemestersFromApi()
        if (isMounted && semData?.semesters && semData.semesters.length > 0) {
          setSemesterList(semData.semesters)
        }
      } catch (e) {
        // Fallback already in state
      }

      try {
        // Fetch full course catalog from backend and merge with student's local plan
        const courseData = await fetchCoursesFromApi()
        if (isMounted && courseData?.courses && courseData.courses.length > 0) {
          setCourseList((prevList) => {
            // Map existing user course statuses by ID
            const statusMap = new Map()
            for (const c of prevList) {
              statusMap.set(c.id, {
                academicStatus: c.academicStatus,
                plannedSemester: c.plannedSemester,
              })
            }

            return courseData.courses.map((apiCourse) => {
              const existing = statusMap.get(apiCourse.id)
              return {
                ...apiCourse,
                academicStatus: existing ? existing.academicStatus : (apiCourse.academicStatus || 'not-planned'),
                plannedSemester: existing ? existing.plannedSemester : (apiCourse.plannedSemester || null),
              }
            })
          })
        }
      } catch (e) {
        // Fallback already in state
      }
    }

    loadBackendData()
    return () => {
      isMounted = false
    }
  }, [])

  // Requirement credits update dynamically whenever courses move or change status
  const requirements = useMemo(
    () => deriveRequirementCredits(baseRequirements, courseList),
    [baseRequirements, courseList],
  )

  // Moves a course to a semester; semesterId = null removes it from plan
  // Completed courses are locked in history
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

  // Adds the next semester chronologically
  function addSemester() {
    setSemesterList((prev) => {
      const next = nextSemester(prev[prev.length - 1])
      return prev.some((s) => s.id === next.id) ? prev : [...prev, next]
    })
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-name">UF Planner</p>
          <h1>{programInfo.name}</h1>
        </div>
        <span className="student-year">{programInfo.catalogYear} · Fall 2026</span>
      </header>

      <div className="panel-layout">
        <Requirements
          requirements={requirements}
          selectedRequirementId={selectedRequirementId}
          onSelectRequirement={setSelectedRequirementId}
        />

        <CourseSearch
          selectedRequirementId={selectedRequirementId}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
          courses={courseList}
          semesters={semesterList}
          onAddToPlan={moveCourse}
        />

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
