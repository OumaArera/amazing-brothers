import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getData('appointments/');
    if (res?.error) {
      setError(typeof res.error === 'string' ? res.error : 'Failed to load appointments.');
    } else {
      setAppointments(Array.isArray(res) ? res : (res?.results ?? []));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleSave = async (res) => {
    setSaving(false);
    if (res?.error) {
      const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
      setSaveError(msg);
      return { success: false, error: msg };
    }
    await fetchAppointments();
    return { success: true, data: res };
  };

  const createAppointment = async (payload) => {
    setSaving(true);
    setSaveError(null);
    return handleSave(await createData('appointments/', payload, true));
  };

  const updateAppointment = async (id, payload) => {
    setSaving(true);
    setSaveError(null);
    return handleSave(await updateData(`appointments/${id}/`, payload, true));
  };

  return {
    appointments, loading, error,
    saving, saveError, setSaveError,
    createAppointment, updateAppointment,
    refetch: fetchAppointments,
  };
};

export default useAppointments;