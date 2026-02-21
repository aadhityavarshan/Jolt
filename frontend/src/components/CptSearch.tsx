import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Tag, ChevronRight, Loader2 } from 'lucide-react';
import { api, type CptCode } from '../lib/api';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface Props {
  value: CptCode | null;
  onChange: (cpt: CptCode | null) => void;
  placeholder?: string;
}

export function CptSearch({ value, onChange, placeholder = 'Search CPT code or procedure…' }: Props) {
  const [query, setQuery] = useState(value ? `${value.code} — ${value.description}` : '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  // Sync display value when external value changes
  useEffect(() => {
    if (value) setQuery(`${value.code} — ${value.description}`);
  }, [value]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['cpt', 'search', debouncedQuery],
    queryFn: () => api.cpt.search(debouncedQuery),
    enabled: debouncedQuery.length >= 1 && open,
    staleTime: 60_000,
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect(cpt: CptCode) {
    onChange(cpt);
    setQuery(`${cpt.code} — ${cpt.description}`);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onChange(null);
    setOpen(true);
  }

  function handleClear() {
    setQuery('');
    onChange(null);
    setOpen(false);
  }

  const showDropdown = open && debouncedQuery.length >= 1;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        {isFetching ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="text-slate-300 hover:text-slate-500 transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              {isFetching ? 'Searching…' : 'No CPT codes found'}
            </div>
          ) : (
            <ul role="listbox">
              {results.map((cpt) => (
                <li key={cpt.id}>
                  <button
                    role="option"
                    aria-selected={value?.id === cpt.id}
                    onClick={() => handleSelect(cpt)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 font-mono">{cpt.code}</p>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{cpt.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {cpt.category}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
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
