import { useState, useEffect, useCallback } from "react";

/**
 * Fetches from API and falls back to mockData on failure.
 * Returns { data, loading, error, refetch }
 */
export function useApiData(fetchFn, fallback = null) {
  const [data, setData]       = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err);
      if (fallback !== null) setData(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
