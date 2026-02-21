import { Routes, Route, Navigate } from 'react-router-dom'
import { SearchPage } from './pages/SearchPage'
import { PatientPage } from './pages/PatientPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/patient/:id" element={<PatientPage />} />
      {/* /determination/:id — to be built in Phase 4 frontend */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
