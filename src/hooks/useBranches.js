import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

/**
 * useBranches — fetch, create, and update branches.
 *
 * Exposes:
 *   branches      — array of branch objects (each has embedded facility object)
 *   loading       — initial fetch in progress
 *   error         — fetch error or null
 *   saving        — create/update in progress
 *   saveError     — create/update error or null
 *   setSaveError
 *   createBranch(payload)       → { success, data } | { success: false, error }
 *   updateBranch(id, payload)   → { success, data } | { success: false, error }
 *   refetch()
 */
const useBranches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getData('branches/');
    if (response?.error) {
      setError(typeof response.error === 'string' ? response.error : 'Failed to load branches.');
    } else {
      setBranches(Array.isArray(response) ? response : (response?.results ?? []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleResponse = async (response, refetch) => {
    if (response?.error) {
      const msg = typeof response.error === 'string'
        ? response.error
        : JSON.stringify(response.error);
      setSaveError(msg);
      setSaving(false);
      return { success: false, error: msg };
    }
    await refetch();
    setSaving(false);
    return { success: true, data: response };
  };

  const createBranch = async (payload) => {
    setSaving(true);
    setSaveError(null);
    const response = await createData('branches/', payload, true);
    return handleResponse(response, fetchBranches);
  };

  const updateBranch = async (id, payload) => {
    setSaving(true);
    setSaveError(null);
    const response = await updateData(`branches/${id}/`, payload, true);
    return handleResponse(response, fetchBranches);
  };

  return {
    branches,
    loading,
    error,
    saving,
    saveError,
    setSaveError,
    createBranch,
    updateBranch,
    refetch: fetchBranches,
  };
};

export default useBranches;