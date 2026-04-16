import { useState, useEffect, useCallback } from 'react';
import { getData, createData, updateData } from '../utils/api';

// ─── shared error extractor ───────────────────────────────────────────────────
const extractMsg = e =>
  typeof e === 'string' ? e : JSON.stringify(e);

// ─── Care Categories ──────────────────────────────────────────────────────────
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await getData('care/categories/');           // ✅ correct endpoint
    if (res?.error) setError(extractMsg(res.error) || 'Failed to load categories.');
    else setCategories(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('care/categories/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  const update = async (id, payload) => {
    setSaving(true); setSaveError(null);
    const res = await updateData(`care/categories/${id}/`, payload, true);   // categories have no update endpoint in urls.py — PATCH to same base
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  return { categories, loading, error, saving, saveError, setSaveError, create, update, refetch: fetch };
};

// ─── Care Items ───────────────────────────────────────────────────────────────
export const useCareItems = (categoryId = null) => {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    const endpoint = categoryId
      ? `care/items/?category=${categoryId}&page_size=100`
      : 'care/items/?page_size=100';
    const res = await getData(endpoint);
    if (res?.error) setError(extractMsg(res.error) || 'Failed to load care items.');
    else setItems(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, [categoryId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('care/items/', payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  const update = async (id, payload) => {
    setSaving(true); setSaveError(null);
    const res = await updateData(`care/items/${id}/`, payload, true);
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  return { items, loading, error, saving, saveError, setSaveError, create, update, refetch: fetch };
};

// ─── Care Charts ──────────────────────────────────────────────────────────────
export const useCareCharts = () => {
  const [charts, setCharts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetch = useCallback(async (queryString = '') => {
    setLoading(true); setError(null);
    const res = await getData(`care/charts/${queryString}`);  // ✅ GET list endpoint
    if (res?.error) setError(extractMsg(res.error) || 'Failed to load charts.');
    else setCharts(Array.isArray(res) ? res : (res?.results ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /**
   * Submit a new daily chart.
   * POST care/chart/
   * Body: { resident: UUID, date: "YYYY-MM-DD", items: [{ care_item: UUID, value: bool }] }
   */
  const submitChart = async (payload) => {
    setSaving(true); setSaveError(null);
    const res = await createData('care/chart/', payload, true); // ✅ correct POST endpoint
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  /**
   * Review a submitted chart.
   * POST care/chart/review/<chart_id>/
   * Body: { status: "approved"|"rejected", rejection_reason?: string }
   */
  const reviewChart = async (chartId, status, rejectionReason = '') => {
    setSaving(true); setSaveError(null);
    const payload = {
      status,
      ...(status === 'rejected' ? { rejection_reason: rejectionReason } : {}),
    };
    const res = await createData(`care/chart/review/${chartId}/`, payload, true); // ✅ correct review endpoint
    setSaving(false);
    if (res?.error) { const m = extractMsg(res.error); setSaveError(m); return { success: false, error: m }; }
    await fetch(); return { success: true, data: res };
  };

  /**
   * Fetch chart detail (items) for a specific resident + date.
   * GET care/chart/<resident_id>/<date>/
   */
  const fetchChartDetail = async (residentId, date) => {
    const res = await getData(`care/chart/${residentId}/${date}/`);
    if (res?.error) return { success: false, error: extractMsg(res.error) };
    // API returns { count, next, previous, results: { id, resident, date, items: [...] } }
    // results is an object (single chart), not an array — unwrap it
    const data = res?.results ?? res;
    return { success: true, data };
  };

  return {
    charts, loading, error,
    saving, saveError, setSaveError,
    submitChart, reviewChart, fetchChartDetail,
    refetch: fetch,
  };
};