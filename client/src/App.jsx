import { useState } from 'react'
import Requirements from './components/Requirements'
import CourseSearch from './components/CourseSearch'
import { degreeRequirements } from './data/mockdata'
import './App.css'

function App() {
  const [selectedRequirementId, setSelectedRequirementId] = useState(
    'computing-electives',
  )
  const [selectedSemesterId, setSelectedSemesterId] = useState('fall-2026')

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-name">UF Planner</p>
          <h1>Computer Science, B.S.</h1>
        </div>
        <span className="student-year">Fall 2026 plan</span>
      </header>

      <div className="panel-layout">
        <Requirements
          requirements={degreeRequirements}
          selectedRequirementId={selectedRequirementId}
          onSelectRequirement={setSelectedRequirementId}
        />

        <CourseSearch
          selectedRequirementId={selectedRequirementId}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
        />
      </div>
    </main>
  )
}

export default App
