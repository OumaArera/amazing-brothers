import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

const extractMsg = e => typeof e === 'string' ? e : JSON.stringify(e);

// All 24 hours labelled for display
export const HOURS = Array.from({ length: 24 }, (_, i) => ({
  hour:  i,
  label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
}));

// ─── useSleepPatterns — caregiver (filtered by resident) ─────────────────────
export const useSleepPatterns = (residentId = null) => {
  const [patterns,  setPatterns]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetch = useCallback(async () => {
    if (!residentId) { setPatterns([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const res = await getData(`sleep-patterns/?resident_id=${residentId}&page_size=100`);
    if (res?.error) setError(extractMsg(res.error));
    else setPatterns(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, [residentId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('sleep-patterns/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  const update = async (id, payload) => {
    setSaving(true); setSaveError(null);
    const res = await updateData(`sleep-patterns/${id}/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  const patternByDate = Object.fromEntries(patterns.map(p => [p.date, p]));

  return {
    patterns, patternByDate,
    loading, error,
    saving, saveError, setSaveError,
    create, update, refetch: fetch,
  };
};

// ─── useAllSleepPatterns — manager (all residents, all dates) ─────────────────
export const useAllSleepPatterns = () => {
  const [patterns, setPatterns] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await getData('sleep-patterns/?page_size=500');
    if (res?.error) setError(extractMsg(res.error));
    else setPatterns(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { patterns, loading, error, refetch: fetch };
};