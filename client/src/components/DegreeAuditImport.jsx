import { useRef, useState } from 'react'
import { FaCircleCheck, FaFilePdf, FaTriangleExclamation, FaXmark } from 'react-icons/fa6'
import { parseDegreeAuditPdfFromApi } from '../services/api'
import './DegreeAuditImport.css'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function DegreeAuditImport({ onImport }) {
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [parsedPdf, setParsedPdf] = useState(null)
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  function resetForm() {
    setSelectedFile(null)
    setParsedPdf(null)
    setCourses([])
    setError('')
    setIsReading(false)
    setIsImporting(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function openDialog() {
    resetForm()
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
    resetForm()
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    resetForm()
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      setError('Please choose a PDF saved from the ONE.UF Degree Audit page.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('The degree-audit PDF must be smaller than 10 MB.')
      return
    }

    setSelectedFile(file)
    setIsReading(true)
    try {
      const result = await parseDegreeAuditPdfFromApi(file)
      setParsedPdf(result)
      setCourses(
        result.candidates.map((candidate) => ({
          ...candidate,
          included: candidate.selected,
          status: candidate.suggestedStatus,
          plannedSemesterId:
            candidate.plannedSemesterId ||
            (candidate.suggestedStatus === 'planned' ? 'fall-2026' : null),
        })),
      )
    } catch (fileError) {
      setError(fileError.message || 'The PDF could not be read.')
    } finally {
      setIsReading(false)
    }
  }

  function updateCourse(index, changes) {
    setCourses((current) =>
      current.map((course, courseIndex) =>
        courseIndex === index ? { ...course, ...changes } : course,
      ),
    )
  }

  async function handleImport() {
    const includedCourses = courses.filter((course) => course.included)
    if (includedCourses.length === 0) {
      setError('Select at least one course before importing.')
      return
    }

    setIsImporting(true)
    setError('')
    const auditData = {
      student: { id: 'demo-student', displayName: 'UF Student' },
      programId: 'cs-bs-eng',
      catalogYear: '2026-2027',
      source: 'one-uf-pdf',
      courses: includedCourses.map((course) => ({
        code: course.code,
        title: course.title,
        credits: course.credits,
        status: course.status,
        sourceType: 'uf',
        plannedSemesterId:
          course.status === 'planned' ? course.plannedSemesterId || 'fall-2026' : null,
        requirementApplications: course.requirementApplications,
      })),
    }

    try {
      const result = await onImport(auditData)
      setSuccessMessage(
        `Imported ${result.courses.length} reviewed courses from ${selectedFile.name}.`,
      )
      dialogRef.current?.close()
      resetForm()
    } catch (importError) {
      setError(importError.message || 'The degree audit could not be imported.')
      setIsImporting(false)
    }
  }

  const includedCount = courses.filter((course) => course.included).length

  return (
    <>
      <button className="audit-import-button" type="button" onClick={openDialog}>
        <FaFilePdf aria-hidden="true" />
        Import audit PDF
      </button>

      {successMessage && (
        <div className="audit-import-success" role="status">
          <FaCircleCheck aria-hidden="true" />
          <span>{successMessage}</span>
          <button type="button" aria-label="Dismiss import message" onClick={() => setSuccessMessage('')}>
            <FaXmark aria-hidden="true" />
          </button>
        </div>
      )}

      <dialog className="audit-import-dialog" ref={dialogRef} onClose={resetForm}>
        <div className="audit-dialog-heading">
          <div>
            <p className="section-label">Update your progress</p>
            <h3>Import degree audit PDF</h3>
          </div>
          <button type="button" aria-label="Close import dialog" onClick={closeDialog}>
            <FaXmark aria-hidden="true" />
          </button>
        </div>

        <p className="audit-dialog-description">
          In ONE.UF, open Degree Audit, choose Print, and save it as a PDF. Upload
          that file here, then review the courses before updating your plan.
        </p>

        <label className={`audit-file-picker ${parsedPdf ? 'ready' : ''}`}>
          <FaFilePdf aria-hidden="true" />
          <span>
            <strong>{selectedFile ? selectedFile.name : 'Choose degree-audit PDF'}</strong>
            <small>{isReading ? 'Reading course information…' : 'PDF format · maximum 10 MB'}</small>
          </span>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
        </label>

        {parsedPdf && (
          <>
            <div className="audit-file-summary" aria-label="Selected audit summary">
              <span><strong>{parsedPdf.pageCount}</strong>Pages</span>
              <span><strong>{courses.length}</strong>Courses found</span>
              <span><strong>{includedCount}</strong>Selected</span>
            </div>

            <div className="audit-review-note">
              <FaTriangleExclamation aria-hidden="true" />
              <span>Review these results. Courses marked “Check” were found without a clear grade or status.</span>
            </div>

            <div className="audit-course-review" aria-label="Review extracted courses">
              {courses.map((course, index) => (
                <div className={`audit-course-row ${course.included ? 'included' : ''}`} key={course.code}>
                  <input
                    type="checkbox"
                    checked={course.included}
                    aria-label={`Include ${course.code}`}
                    onChange={(event) => updateCourse(index, { included: event.target.checked })}
                  />
                  <div className="audit-course-details">
                    <strong>{course.code}</strong>
                    <span>{course.title}</span>
                  </div>
                  {course.confidence === 'review' && <span className="audit-review-badge">Check</span>}
                  <select
                    value={course.status}
                    aria-label={`Status for ${course.code}`}
                    onChange={(event) => updateCourse(index, { status: event.target.value })}
                  >
                    <option value="completed">Completed</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p className="audit-import-error" role="alert">{error}</p>}

        <div className="audit-dialog-actions">
          <button className="audit-cancel-button" type="button" onClick={closeDialog}>Cancel</button>
          <button
            className="audit-submit-button"
            type="button"
            disabled={!parsedPdf || includedCount === 0 || isImporting}
            onClick={handleImport}
          >
            {isImporting ? 'Importing…' : `Import ${includedCount || ''} reviewed courses`}
          </button>
        </div>
      </dialog>
    </>
  )
}

export default DegreeAuditImport
