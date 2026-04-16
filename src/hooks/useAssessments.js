import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

/**
 * useAssessments — fetch, create, and update assessments.
 *
 * Exposes:
 *   assessments    — array of assessment objects
 *   loading        — initial fetch in progress
 *   error          — fetch error or null
 *   saving         — create/update in progress
 *   saveError      — create/update error or null
 *   setSaveError
 *   createAssessment(payload)     → { success, data } | { success: false, error }
 *   updateAssessment(id, payload) → { success, data } | { success: false, error }
 *   refetch()
 */
const useAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getData('assessments/');
    if (response?.error) {
      setError(typeof response.error === 'string' ? response.error : 'Failed to load assessments.');
    } else {
      setAssessments(Array.isArray(response) ? response : (response?.results ?? []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleSave = async (response) => {
    setSaving(false);
    if (response?.error) {
      const msg = typeof response.error === 'string'
        ? response.error
        : JSON.stringify(response.error);
      setSaveError(msg);
      return { success: false, error: msg };
    }
    await fetchAssessments();
    return { success: true, data: response };
  };

  const createAssessment = async (payload) => {
    setSaving(true);
    setSaveError(null);
    return handleSave(await createData('assessments/', payload, true));
  };

  const updateAssessment = async (id, payload) => {
    setSaving(true);
    setSaveError(null);
    return handleSave(await updateData(`assessments/${id}/`, payload, true));
  };

  return {
    assessments,
    loading,
    error,
    saving,
    saveError,
    setSaveError,
    createAssessment,
    updateAssessment,
    refetch: fetchAssessments,
  };
};

export default useAssessments;