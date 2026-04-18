import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

const extractMsg = e => typeof e === 'string' ? e : JSON.stringify(e);

// ─── useLatePermissions ───────────────────────────────────────────────────────
// GET  late-permissions/                 → all permissions (filterable)
// GET  late-permissions/?branch=<id>     → filter by branch
// GET  late-permissions/?submission_type=<type>
// POST late-permissions/                 → create (manager)
// PATCH late-permissions/<pk>/           → update (manager)
// DELETE via PATCH or fetch DELETE

export const useLatePermissions = (filters = {}) => {
  const [permissions, setPermissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({ page_size: 200 });
    if (filters.branch)          params.set('branch', filters.branch);
    if (filters.submission_type) params.set('submission_type', filters.submission_type);
    return params.toString();
  }, [filters.branch, filters.submission_type]);

  const refetchData = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await getData(`late-permissions/?${buildQuery()}`);
    if (res?.error) setError(extractMsg(res.error));
    else setPermissions(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => { refetchData(); }, [refetchData]);

  // POST — create a new late-submission permission
  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('late-permissions/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await refetchData(); return { success: true, data: res };
  };

  // PATCH — extend or edit
  const update = async (id, payload) => {
    setSaving(true); setSaveError(null);
    const res = await updateData(`late-permissions/${id}/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await refetchData(); return { success: true, data: res };
  };

  // DELETE
  const remove = async (id) => {
    setSaving(true); setSaveError(null);
    const token = localStorage.getItem('access_token');
    try {
      const response = await window.fetch(`${import.meta.env.VITE_BASE_URL}/late-permissions/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSaving(false);
      if (!response.ok) { const m = 'Failed to delete permission'; setSaveError(m); return { success: false, error: m }; }
      await refetchData(); return { success: true };
    } catch {
      setSaving(false);
      const m = 'Network error while deleting';
      setSaveError(m); return { success: false, error: m };
    }
  };

  // Derived: active permissions only
  const activePermissions = permissions.filter(p => p.is_active);

  return {
    permissions, activePermissions,
    loading, error,
    saving, saveError, setSaveError,
    create, update, remove,
    refetch: refetchData,
  };
};