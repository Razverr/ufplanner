import { useState } from 'react'
import Requirements from './components/Requirements'
import { degreeRequirements } from './data/mockdata'
import './App.css'

function App() {
  const [selectedRequirementId, setSelectedRequirementId] = useState(
    'computing-electives',
  )

  const selectedRequirement = degreeRequirements.find(
    (requirement) => requirement.id === selectedRequirementId,
  )

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-name">UF Planner</p>
          <h1>Computer Science, B.S.</h1>
        </div>
        <span className="student-year">Fall 2026 plan</span>
      </header>

      <div className="preview-layout">
        <Requirements
          requirements={degreeRequirements}
          selectedRequirementId={selectedRequirementId}
          onSelectRequirement={setSelectedRequirementId}
        />

        <aside className="integration-preview" aria-live="polite">
          <p className="preview-label">Course discovery connection</p>
          <h2>{selectedRequirement.name}</h2>
          <p>
            The course discovery panel would now filter its results to courses
            that satisfy this requirement.
          </p>
          <div className="preview-course">
            <span>CIS 4930</span>
            <strong>Computing Elective</strong>
            <small>3 credits · Counts toward {selectedRequirement.name}</small>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default App
