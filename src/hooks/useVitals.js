import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

const extractMsg = e => typeof e === 'string' ? e : JSON.stringify(e);

/**
 * useVitals — list, create, and review vitals.
 *
 * Endpoints (from urls.py):
 *   GET    vitals/                → paginated list (supports ?resident=&status=&date=)
 *   POST   vitals/                → create  (caregiver)
 *   PATCH  vitals/<pk>/           → update  (caregiver — reason_edited required)
 *   POST   vitals/<pk>/review/    → approve / decline (manager)
 */
const useVitals = () => {
  const [vitals, setVitals]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetch = useCallback(async (params = '') => {
    setLoading(true); setError(null);
    const res = await getData(`vitals/${params}`);
    if (res?.error) setError(extractMsg(res.error) || 'Failed to load vitals.');
    else setVitals(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /** POST vitals/ — caregiver submits a new vital reading */
  const createVital = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('vitals/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  /** PATCH vitals/<id>/ — caregiver edits a declined/pending vital */
  const updateVital = async (id, payload) => {
    setSaving(true); setSaveError(null);
    const res = await updateData(`vitals/${id}/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  /** POST vitals/<id>/review/ — manager approves or declines */
  const reviewVital = async (id, status, declineReason = '') => {
    setSaving(true); setSaveError(null);
    const payload = { status, ...(status === 'declined' ? { decline_reason: declineReason } : {}) };
    const res = await updateData(`vitals/${id}/review/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  return {
    vitals, loading, error,
    saving, saveError, setSaveError,
    createVital, updateVital, reviewVital,
    refetch: fetch,
  };
};

export default useVitals;