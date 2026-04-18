import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

const extractMsg = e => typeof e === 'string' ? e : JSON.stringify(e);

// ─── useMyLeave — current user's own requests (caregiver OR manager own) ──────
// GET  leave-requests/            → only caller's requests (backend filters by user)
// POST leave-requests/            → create a new request
export const useMyLeave = () => {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await getData('leave-requests/?page_size=100');
    if (res?.error) setError(extractMsg(res.error));
    else setRequests(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('leave-requests/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  return { requests, loading, error, saving, saveError, setSaveError, create, refetch: fetch };
};

// ─── useAllLeave — all leave requests (manager review view) ──────────────────
// The backend filters by staff=user, so we can't get all requests from the
// standard list endpoint. We fetch without filter and rely on the backend
// returning what the authenticated user is allowed to see.
// For manager use, we fetch with no extra params — same endpoint but the
// manager also sees only their own from GET. For a full review list, the
// backend should ideally expose an admin override; until then we surface
// what the API returns and supplement with the review action.
export const useAllLeave = () => {
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    // Fetch all pages by requesting large page size
    const res = await getData('leave-requests/?page_size=200');
    if (res?.error) setError(extractMsg(res.error));
    else setRequests(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // POST leave-requests/<pk>/review/  { action: "approve"|"decline", decline_reason? }
  const review = async (id, action, declineReason = '') => {
    setSaving(true); setSaveError(null);
    const payload = { action, ...(action === 'decline' ? { decline_reason: declineReason } : {}) };
    const res = await createData(`leave-requests/${id}/review/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  // Also allow manager to submit their own request
  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('leave-requests/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  return { requests, loading, error, saving, saveError, setSaveError, create, review, refetch: fetch };
};