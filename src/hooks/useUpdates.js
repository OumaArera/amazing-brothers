import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

const extractMsg = e => typeof e === 'string' ? e : JSON.stringify(e);

// ─── useUpdates — shared by caregiver and manager ─────────────────────────────
// GET  updates/?resident_id=<uuid>  (optional filter)
// POST updates/
// POST updates/<pk>/review/   { action: "approve"|"decline", decline_reason? }
const useUpdates = (residentId = null) => {
  const [updates,   setUpdates]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    const endpoint = residentId
      ? `updates/?resident_id=${residentId}&page_size=100`
      : 'updates/?page_size=100';
    const res = await getData(endpoint);
    if (res?.error) setError(extractMsg(res.error));
    else setUpdates(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, [residentId]);

  useEffect(() => { fetch(); }, [fetch]);

  // POST updates/
  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('updates/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  // PATCH updates/<pk>/
  const update = async (id, payload) => {
    setSaving(true); setSaveError(null);
    const res = await updateData(`updates/${id}/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  // POST updates/<pk>/review/  { action, decline_reason? }
  const review = async (id, action, declineReason = '') => {
    setSaving(true); setSaveError(null);
    const payload = { action, ...(action === 'decline' ? { decline_reason: declineReason } : {}) };
    const res = await createData(`updates/${id}/review/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  return {
    updates, loading, error,
    saving, saveError, setSaveError,
    create, update, review,
    refetch: fetch,
  };
};

export default useUpdates;