import { useState, useEffect, useCallback } from 'react';
import { getData, createData } from '../utils/api';

const extractMsg = e => typeof e === 'string' ? e : JSON.stringify(e);

// GET  grocery-requests/?branch_id=<id>   → list
// POST grocery-requests/                  → create { branch_id, items: [{name, quantity, particulars?}] }
// POST grocery-requests/<pk>/review/      → { action: "approve"|"decline"|"fulfill", decline_reason? }

const useGroceries = (filters = {}) => {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams({ page_size: 200 });
    if (filters.branch_id) p.set('branch_id', filters.branch_id);
    return p.toString();
  }, [filters.branch_id]);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await getData(`grocery-requests/?${buildQuery()}`);
    if (res?.error) setError(extractMsg(res.error));
    else setRequests(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => { refetch(); }, [refetch]);

  // POST grocery-requests/
  // payload: { branch_id, items: [{ name, quantity, particulars? }] }
  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('grocery-requests/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await refetch(); return { success: true, data: res };
  };

  // POST grocery-requests/<pk>/review/
  const review = async (id, action, declineReason = '') => {
    setSaving(true); setSaveError(null);
    const payload = { action, ...(action === 'decline' ? { decline_reason: declineReason } : {}) };
    const res = await createData(`grocery-requests/${id}/review/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await refetch(); return { success: true, data: res };
  };

  return {
    requests, loading, error,
    saving, saveError, setSaveError,
    create, review, refetch,
  };
};

export default useGroceries;