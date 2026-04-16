import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

/**
 * useResidents — fetch, create, and update residents.
 *
 * Exposes:
 *   residents     — array of resident objects
 *   loading       — initial fetch in progress
 *   error         — fetch error or null
 *   saving        — create/update in progress
 *   saveError     — create/update error or null
 *   setSaveError
 *   createResident(payload)       → { success, data } | { success: false, error }
 *   updateResident(id, payload)   → { success, data } | { success: false, error }
 *   refetch()
 */
const useResidents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getData('residents/');
    if (response?.error) {
      setError(typeof response.error === 'string' ? response.error : 'Failed to load residents.');
    } else {
      setResidents(Array.isArray(response) ? response : (response?.results ?? []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchResidents(); }, [fetchResidents]);

  const handleSave = async (response) => {
    setSaving(false);
    if (response?.error) {
      const msg = typeof response.error === 'string'
        ? response.error
        : JSON.stringify(response.error);
      setSaveError(msg);
      return { success: false, error: msg };
    }
    await fetchResidents();
    return { success: true, data: response };
  };

  const createResident = async (payload) => {
    setSaving(true);
    setSaveError(null);
    return handleSave(await createData('residents/', payload, true));
  };

  const updateResident = async (id, payload) => {
    setSaving(true);
    setSaveError(null);
    return handleSave(await updateData(`residents/${id}/`, payload, true));
  };

  return {
    residents,
    loading,
    error,
    saving,
    saveError,
    setSaveError,
    createResident,
    updateResident,
    refetch: fetchResidents,
  };
};

export default useResidents;