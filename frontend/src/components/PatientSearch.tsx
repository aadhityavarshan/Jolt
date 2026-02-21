import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, User, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { api, type Patient } from '../lib/api';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatDob(dob: string): string {
  const d = new Date(dob);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PatientSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 200);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['patients', 'search', debouncedQuery],
    queryFn: () => api.patients.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect(patient: Patient) {
    setQuery(`${patient.first_name} ${patient.last_name}`);
    setOpen(false);
    navigate(`/patient/${patient.id}`);
  }

  const showDropdown = open && debouncedQuery.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        {isFetching ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search patients by name…"
          className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="text-slate-300 hover:text-slate-500 transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              {isFetching ? 'Searching…' : 'No patients found'}
            </div>
          ) : (
            <ul role="listbox">
              {results.map((patient) => (
                <li key={patient.id}>
                  <button
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(patient)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <p className="text-xs text-slate-500">DOB {formatDob(patient.dob)}</p>
                          {patient.mrn && (
                            <span className="text-xs text-slate-400 ml-2">MRN {patient.mrn}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
