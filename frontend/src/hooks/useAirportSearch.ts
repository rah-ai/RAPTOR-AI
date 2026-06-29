/* ─── RAPTOR Airport Search Hook ─── */

import { useState, useCallback, useRef } from 'react';
import type { Airport } from '../types/raptor';
import { api } from '../api/raptor';

interface UseAirportSearchReturn {
  query: string;
  results: Airport[];
  isLoading: boolean;
  error: string | null;
  setQuery: (q: string) => void;
  clearResults: () => void;
}

export function useAirportSearch(): UseAirportSearchReturn {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    setError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const data = await api.searchAirports(q);
        setResults(data.airports);
      } catch (err) {
        setError('Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setQueryState('');
  }, []);

  return { query, results, isLoading, error, setQuery, clearResults };
}
