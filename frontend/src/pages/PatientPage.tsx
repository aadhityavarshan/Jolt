import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User, Shield, FileText, Zap, Loader2, AlertCircle } from 'lucide-react'
import { api, type CptCode } from '../lib/api'
import { CptSearch } from '../components/CptSearch'
import { useState } from 'react'

function formatDob(dob: string) {
  return new Date(dob).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function PatientPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedCpt, setSelectedCpt] = useState<CptCode | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.patients.get(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-slate-600">Patient not found.</p>
        <button onClick={() => navigate('/')} className="text-sm text-blue-600 underline">
          Back to search
        </button>
      </div>
    )
  }

  const { patient, coverage, documents } = data
  const activePayer = coverage[0]?.payer ?? null

  async function handleEvaluate() {
    if (!selectedCpt || !activePayer || !id) return
    const { determination_id } = await api.evaluate.trigger({
      patient_id: id,
      cpt_code: selectedCpt.code,
      payer: activePayer,
    })
    navigate(`/determination/${determination_id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </button>

        {/* Patient card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <User className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                DOB {formatDob(patient.dob)}
                {patient.mrn && <span className="ml-3 text-slate-400">MRN {patient.mrn}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Coverage */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Coverage
            </h3>
          </div>
          {coverage.length === 0 ? (
            <p className="text-sm text-slate-400">No active coverage on file</p>
          ) : (
            <div className="space-y-2">
              {coverage.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.payer}</p>
                    {c.plan_name && (
                      <p className="text-xs text-slate-500">{c.plan_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.member_id && (
                      <span className="text-xs text-slate-400">ID {c.member_id}</span>
                    )}
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Clinical Documents ({documents.length})
            </h3>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">No clinical documents uploaded</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.filename} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm text-slate-900">{doc.filename}</p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      {doc.record_type.replace(/_/g, ' ')}
                      {doc.date && ` · ${new Date(doc.date).toLocaleDateString()}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Evaluate */}
        {activePayer && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Request Prior Auth
              </h3>
            </div>
            <div className="space-y-3">
              <CptSearch value={selectedCpt} onChange={setSelectedCpt} />
              <button
                onClick={handleEvaluate}
                disabled={!selectedCpt}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Evaluate with {activePayer}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
