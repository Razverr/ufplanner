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
  fetchDegreeAuditFromApi,
  fetchRequirementsFromApi,
  fetchSemestersFromApi,
  importDegreeAuditFromApi,
} from './services/api'
import './App.css'

function getProgramInfo(program) {
  return {
    name: program.name,
    college: program.college,
    catalogYear: program.catalog_year || '2026-2027',
  }
}

function mergeAuditCourses(catalogCourses, auditCourses = []) {
  const auditById = new Map(auditCourses.map((course) => [course.courseId, course]))
  const auditByCode = new Map(auditCourses.map((course) => [course.code, course]))
  const mergedIds = new Set()

  const mergedCatalog = catalogCourses.map((course) => {
    const auditCourse = auditById.get(course.id) || auditByCode.get(course.code)
    if (!auditCourse) {
      return { ...course, academicStatus: 'not-planned', plannedSemester: null }
    }

    mergedIds.add(auditCourse.courseId)
    return {
      ...course,
      academicStatus: auditCourse.academicStatus,
      plannedSemester: auditCourse.plannedSemester,
      requirementIds: auditCourse.requirementIds,
    }
  })

  const auditOnlyCourses = auditCourses
    .filter((course) => !mergedIds.has(course.courseId))
    .map((course) => ({
      id: course.courseId,
      code: course.code,
      title: course.title,
      credits: course.credits,
      description: 'Imported from the student degree audit.',
      academicStatus: course.academicStatus,
      plannedSemester: course.plannedSemester,
      requirementIds: course.requirementIds,
      prerequisites: [],
      offeredSemesters: [],
      sourceType: course.sourceType,
    }))

  return [...mergedCatalog, ...auditOnlyCourses]
}

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
      let auditCourseMap = new Map()
      let auditCourseCodeMap = new Map()
      let auditLoaded = false

      try {
        // Fetch verified degree requirements
        const reqData = await fetchRequirementsFromApi()
        if (isMounted && reqData?.requirements) {
          setBaseRequirements(reqData.requirements)
          if (reqData.program) {
            setProgramInfo(getProgramInfo(reqData.program))
          }
        }
      } catch {
        // Fallback already in state
      }

      try {
        // Load the student's normalized degree audit, including AP/transfer credit.
        const auditData = await fetchDegreeAuditFromApi('demo-student')
        if (isMounted && auditData) {
          auditLoaded = true
          if (auditData.requirements?.length > 0) {
            setBaseRequirements(auditData.requirements)
          }
          if (auditData.program) {
            setProgramInfo(getProgramInfo(auditData.program))
          }

          auditCourseMap = new Map(
            (auditData.courses || []).map((course) => [course.courseId, course]),
          )
          auditCourseCodeMap = new Map(
            (auditData.courses || []).map((course) => [course.code, course]),
          )
          setCourseList((prevList) =>
            prevList.map((course) => {
              const auditCourse =
                auditCourseMap.get(course.id) ||
                auditCourseCodeMap.get(course.code)
              return auditCourse
                ? {
                    ...course,
                    academicStatus: auditCourse.academicStatus,
                    plannedSemester: auditCourse.plannedSemester,
                    requirementIds: auditCourse.requirementIds,
                  }
                : {
                    ...course,
                    academicStatus: 'not-planned',
                    plannedSemester: null,
                  }
            }),
          )
        }
      } catch {
        // The local demo data remains usable when the server is offline.
      }

      try {
        // Fetch active semesters
        const semData = await fetchSemestersFromApi()
        if (isMounted && semData?.semesters && semData.semesters.length > 0) {
          setSemesterList(semData.semesters)
        }
      } catch {
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
                requirementIds: c.requirementIds,
              })
            }

            return courseData.courses.map((apiCourse) => {
              const existing = statusMap.get(apiCourse.id)
              const auditCourse =
                auditCourseMap.get(apiCourse.id) ||
                auditCourseCodeMap.get(apiCourse.code)
              return {
                ...apiCourse,
                academicStatus:
                  auditCourse?.academicStatus ||
                  (auditLoaded ? 'not-planned' : existing?.academicStatus) ||
                  apiCourse.academicStatus ||
                  'not-planned',
                plannedSemester:
                  auditCourse?.plannedSemester ??
                  (auditLoaded ? null : existing?.plannedSemester) ??
                  apiCourse.plannedSemester ??
                  null,
                requirementIds:
                  auditCourse?.requirementIds ||
                  (auditLoaded ? apiCourse.requirementIds : existing?.requirementIds) ||
                  apiCourse.requirementIds ||
                  [],
              }
            })
          })
        }
      } catch {
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

  async function importDegreeAudit(auditData) {
    const importedAudit = await importDegreeAuditFromApi(auditData)

    setBaseRequirements(importedAudit.requirements)
    setProgramInfo(getProgramInfo(importedAudit.program))
    setCourseList((currentCourses) =>
      mergeAuditCourses(currentCourses, importedAudit.courses),
    )

    const firstPlannedSemester = importedAudit.courses.find(
      (course) => course.plannedSemester,
    )?.plannedSemester
    if (firstPlannedSemester) setSelectedSemesterId(firstPlannedSemester)

    return importedAudit
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
          onImportAudit={importDegreeAudit}
        />

        <CourseSearch
          selectedRequirementId={selectedRequirementId}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
          onRequirementChange={setSelectedRequirementId}
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
