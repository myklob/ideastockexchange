import { useState, useEffect, useCallback } from 'react';

/**
 * Generic fetch hook for ISE API endpoints.
 * @param {string} url - relative or absolute URL
 * @param {object} options - fetch options (method, body, etc.)
 * @returns {{ data, loading, error, refetch }}
 */
export function useApi(url, options = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`${res.status}: ${msg}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * POST helper — returns { post, loading, error, result }
 */
export function usePost(url) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [result,  setResult]  = useState(null);

  const post = useCallback(async (body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`${res.status}: ${msg}`);
      }
      const json = await res.json();
      setResult(json);
      return json;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { post, loading, error, result };
}
