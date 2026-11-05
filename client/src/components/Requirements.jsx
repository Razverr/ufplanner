import './Requirements.css'
import DegreeAuditImport from './DegreeAuditImport'
import {
  FaAdjust,
  FaBookOpen,
  FaCheckCircle,
  FaClipboardCheck,
  FaGraduationCap,
  FaLaptopCode,
  FaLayerGroup,
  FaRegSquare,
} from 'react-icons/fa'

const requirementIcons = {
  'critical-tracking': FaClipboardCheck,
  'major-core': FaLaptopCode,
  'general-education': FaBookOpen,
  'computing-electives': FaLayerGroup,
  'additional-requirements': FaGraduationCap,
}

function getRequirementStatus(requirement) {
  const accountedFor = requirement.completedCredits + requirement.plannedCredits

  if (requirement.completedCredits >= requirement.totalCredits) {
    return {
      label: 'Completed',
      className: 'completed',
      Icon: FaCheckCircle,
    }
  }

  if (accountedFor >= requirement.totalCredits) {
    return { label: 'Planned', className: 'planned', Icon: FaAdjust }
  }

  return { label: 'Still needed', className: 'needed', Icon: FaRegSquare }
}

function Requirements({
  requirements,
  selectedRequirementId,
  onSelectRequirement,
  onImportAudit,
}) {
  const totals = requirements.reduce(
    (result, requirement) => ({
      total: result.total + requirement.totalCredits,
      completed: result.completed + requirement.completedCredits,
      planned: result.planned + requirement.plannedCredits,
    }),
    { total: 0, completed: 0, planned: 0 },
  )

  const completedPercent = (totals.completed / totals.total) * 100
  const plannedPercent = (totals.planned / totals.total) * 100

  return (
    <section className="requirements-panel" aria-labelledby="requirements-title">
      <div className="requirements-heading">
        <div>
          <p className="section-label">Degree audit</p>
          <h2 id="requirements-title">Requirements &amp; Progress</h2>
        </div>
        <div className="requirements-heading-actions">
          <span className="credit-summary">
            {totals.completed} of {totals.total} credits completed
          </span>
          <DegreeAuditImport onImport={onImportAudit} />
        </div>
      </div>

      <div
        className="overall-progress"
        role="progressbar"
        aria-label={`${totals.completed} of ${totals.total} required credits completed, with ${totals.planned} credits planned`}
        aria-valuemin="0"
        aria-valuemax={totals.total}
        aria-valuenow={totals.completed}
      >
        <span
          className="progress-completed"
          style={{ width: `${completedPercent}%` }}
        />
        <span
          className="progress-planned"
          style={{ width: `${plannedPercent}%` }}
        />
      </div>

      <div className="progress-legend" aria-label="Progress status legend">
        <span><FaCheckCircle className="completed-icon" />Completed</span>
        <span><FaAdjust className="planned-icon" />Planned</span>
        <span><FaRegSquare className="needed-icon" />Still needed</span>
      </div>

      <p className="panel-instructions">
        Select a requirement to find courses that can fulfill it.
      </p>

      <div className="requirement-list">
        {requirements.map((requirement) => {
          const status = getRequirementStatus(requirement)
          const RequirementIcon = requirementIcons[requirement.id] || FaBookOpen
          const StatusIcon = status.Icon
          const remainingCredits = Math.max(
            requirement.totalCredits -
              requirement.completedCredits -
              requirement.plannedCredits,
            0,
          )
          const isSelected = requirement.id === selectedRequirementId

          return (
            <button
              className={`requirement-card ${isSelected ? 'selected' : ''}`}
              key={requirement.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectRequirement(requirement.id)}
            >
              <span className="requirement-card-heading">
                <span className="requirement-title-group">
                  <span className="requirement-icon" aria-hidden="true">
                    <RequirementIcon />
                  </span>
                  <span>
                    <strong>{requirement.name}</strong>
                    <small>{requirement.description}</small>
                  </span>
                </span>
                <span className={`status-badge ${status.className}`}>
                  <StatusIcon aria-hidden="true" />
                  {status.label}
                </span>
              </span>

              <span className="requirement-numbers">
                <span>
                  <strong>{requirement.completedCredits}</strong>
                  <small>completed</small>
                </span>
                <span>
                  <strong>{requirement.plannedCredits}</strong>
                  <small>planned</small>
                </span>
                <span>
                  <strong>{remainingCredits}</strong>
                  <small>remaining</small>
                </span>
              </span>

              {requirement.creditNotes.length > 0 && (
                <span className="credit-note">
                  <span aria-hidden="true">✓</span>
                  {requirement.creditNotes.join(', ')}
                </span>
              )}

              <span className="next-course">
                <span>Next course</span>
                <strong>{requirement.nextCourse}</strong>
              </span>

              <span className="course-link">
                {isSelected ? 'Showing matching courses' : 'View matching courses'}
                <span aria-hidden="true">→</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default Requirements
