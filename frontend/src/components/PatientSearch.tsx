import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User, Loader2 } from 'lucide-react';
import { searchPatients, type PatientSummary } from '../lib/api';

interface Props {
  onSelect: (patient: PatientSummary) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function formatDob(dob: string): string {
  return new Date(dob).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Allow letters, spaces, hyphens, apostrophes — strip everything else silently
const ALLOWED = /[^a-zA-Z\s\-']/g;
const MAX_LENGTH = 100;

export function PatientSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const debouncedQuery = useDebounce(trimmed, 250);

  // Only fire the request when there are at least 2 real characters
  const { data: patients = [], isFetching, isError } = useQuery({
    queryKey: ['patients', 'search', debouncedQuery],
    queryFn: () => searchPatients(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const sanitized = e.target.value
      .replace(ALLOWED, '')   // strip invalid characters
      .slice(0, MAX_LENGTH);  // hard cap at 100 chars
    setQuery(sanitized);
    setOpen(true);
  }

  function handleSelect(patient: PatientSummary) {
    setQuery(`${patient.last_name}, ${patient.first_name}`);
    setOpen(false);
    onSelect(patient);
  }

  // Hint shown below the input (not an error — just guidance)
  const hint =
    trimmed.length === 1
      ? 'Type one more character to search…'
      : null;

  const showDropdown = open && debouncedQuery.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Search patients by name…"
          maxLength={MAX_LENGTH}
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white shadow-sm text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder:text-gray-400"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin" />
        )}
      </div>

      {/* Inline hint */}
      {hint && (
        <p className="mt-1 text-xs text-gray-400 pl-1">{hint}</p>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {isError && (
            <div className="px-4 py-3 text-sm text-red-500 text-center">
              Search failed — please try again.
            </div>
          )}

          {!isError && patients.length === 0 && !isFetching && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No patients found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {patients.map((patient) => {
            const activeCoverage = patient.coverage.find((c) => c.is_active);
            return (
              <button
                key={patient.id}
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => handleSelect(patient)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50
                           transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {patient.last_name}, {patient.first_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    DOB {formatDob(patient.dob)}
                    {patient.mrn && <span className="ml-2">· MRN {patient.mrn}</span>}
                    {activeCoverage && (
                      <span className="ml-2">· {activeCoverage.payer}</span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
