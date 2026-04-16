import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

/**
 * useFacilities — fetch, create, and update facilities.
 *
 * Exposes:
 *   facilities    — array of facility objects
 *   loading       — initial fetch in progress
 *   error         — fetch error string or null
 *   saving        — create/update request in progress
 *   saveError     — create/update error string or null
 *   setSaveError  — clear error manually
 *   createFacility(payload)          → { success, data } | { success: false, error }
 *   updateFacility(id, payload)      → { success, data } | { success: false, error }
 *   refetch()     — manually re-fetch list
 */
const useFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState(null);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await getData('facilities/');
    if (response?.error) {
      setError(typeof response.error === 'string' ? response.error : 'Failed to load facilities.');
    } else {
      // Support both paginated { results: [] } and plain array responses
      setFacilities(Array.isArray(response) ? response : (response?.results ?? []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  const createFacility = async (payload) => {
    setSaving(true);
    setSaveError(null);
    const response = await createData('facilities/', payload, true);
    setSaving(false);
    if (response?.error) {
      const msg = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
      setSaveError(msg);
      return { success: false, error: msg };
    }
    await fetchFacilities();
    return { success: true, data: response };
  };

  const updateFacility = async (id, payload) => {
    setSaving(true);
    setSaveError(null);
    const response = await updateData(`facilities/${id}/`, payload, true);
    setSaving(false);
    if (response?.error) {
      const msg = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
      setSaveError(msg);
      return { success: false, error: msg };
    }
    await fetchFacilities();
    return { success: true, data: response };
  };

  return {
    facilities,
    loading,
    error,
    saving,
    saveError,
    setSaveError,
    createFacility,
    updateFacility,
    refetch: fetchFacilities,
  };
};

export default useFacilities;