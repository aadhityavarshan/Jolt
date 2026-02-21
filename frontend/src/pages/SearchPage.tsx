import { Zap } from 'lucide-react'
import { PatientSearch } from '../components/PatientSearch'

export function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Jolt</h1>
      </div>

      <p className="text-slate-500 text-base mb-10 text-center max-w-sm">
        Prior authorization in seconds, not days.
      </p>

      {/* Search box */}
      <PatientSearch />

      <p className="mt-4 text-xs text-slate-400">
        Type a patient name to begin a prior auth request
      </p>
    </div>
  )
}
