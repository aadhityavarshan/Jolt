import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientSearch } from './components/PatientSearch';
import { PatientCard } from './components/PatientCard';
import type { PatientSummary } from './lib/api';

const queryClient = new QueryClient();

function JoltApp() {
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 tracking-tight">Jolt</h1>
          <span className="text-xs text-gray-400">Prior Authorization · Demo</span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Patient Search</h2>
          <p className="text-sm text-gray-500">
            Search by last or first name to pull up patient details and coverage.
          </p>
        </div>

        <PatientSearch
          onSelect={(patient) => setSelectedPatient(patient)}
        />

        {selectedPatient && (
          <PatientCard
            patientId={selectedPatient.id}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <JoltApp />
    </QueryClientProvider>
  );
}
