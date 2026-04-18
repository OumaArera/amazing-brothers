import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

const extractMsg = e => typeof e === 'string' ? e : JSON.stringify(e);

// GET  utilities/                     → all (manager)
// GET  utilities/?branch_id=<id>
// GET  utilities/?status=<status>
// POST utilities/                     → create (caregiver)
// POST utilities/<pk>/action/         → { action, resolution_notes?, rejection_reason? }

const useUtilities = (filters = {}) => {
  const [utilities,  setUtilities]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState(null);

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams({ page_size: 200 });
    if (filters.branch_id) p.set('branch_id', filters.branch_id);
    if (filters.status)    p.set('status',    filters.status);
    return p.toString();
  }, [filters.branch_id, filters.status]);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await getData(`utilities/?${buildQuery()}`);
    if (res?.error) setError(extractMsg(res.error));
    else setUtilities(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => { refetch(); }, [refetch]);

  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('utilities/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await refetch(); return { success: true, data: res };
  };

  // POST utilities/<pk>/action/
  const action = async (id, actionName, extra = {}) => {
    setSaving(true); setSaveError(null);
    const res = await createData(`utilities/${id}/action/`, { action: actionName, ...extra }, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await refetch(); return { success: true, data: res };
  };

  return { utilities, loading, error, saving, saveError, setSaveError, create, action, refetch };
};

export default useUtilities;