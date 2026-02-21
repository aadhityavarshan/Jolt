import { useQuery } from '@tanstack/react-query';
import { FileText, Shield, Loader2, X } from 'lucide-react';
import { getPatient } from '../lib/api';

interface Props {
  patientId: string;
  onClose: () => void;
}

function formatDob(dob: string): string {
  return new Date(dob).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PatientCard({ patientId, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => getPatient(patientId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading patient…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mt-6 text-red-500 text-sm text-center">
        Failed to load patient details.
      </div>
    );
  }

  const { patient, documents } = data;
  const activeCoverage = patient.coverage.filter((c) => c.is_active);

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 bg-blue-50 border-b border-blue-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {patient.last_name}, {patient.first_name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            DOB {formatDob(patient.dob)}
            {patient.mrn && <span className="ml-2">· MRN {patient.mrn}</span>}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Coverage */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Active Coverage</h3>
          </div>
          {activeCoverage.length === 0 ? (
            <p className="text-sm text-gray-400">No active coverage on file</p>
          ) : (
            <ul className="space-y-2">
              {activeCoverage.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="font-medium text-gray-900">{c.payer}</p>
                  {c.plan_name && <p className="text-gray-500">{c.plan_name}</p>}
                  {c.member_id && <p className="text-gray-400 text-xs">ID: {c.member_id}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Clinical Documents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700">Clinical Documents</h3>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-gray-900 truncate">{doc.source_filename}</p>
                  <p className="text-gray-500 text-xs">
                    {doc.metadata.record_type} · {doc.metadata.date}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
