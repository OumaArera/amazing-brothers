import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { useCategories, useCareItems, useCareCharts } from '../../hooks/useCare';
import useResidents from '../../hooks/useResidents';
import {
  DarkInput, DarkSelect, ModalShell, ErrorBanner, UnsavedBadge,
} from '../../components/ui/FormComponents';
import {
  groupChartItemsByCategory,
  buildMonthlyReportData,
  generateBehaviorReportPDF,
  computeItemFrequency,
  detectPatterns,
} from '../../utils/careReportUtils';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'  },
  approved: { label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'   },
};

const SectionLabel = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    <span className="text-base">{icon}</span>
    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative flex-1">
    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
      style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
      onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
      onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
    />
    {value && <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
  </div>
);

const LoadingState = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
    <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
  </div>
);

const EmptyState = ({ icon, title, sub, onAction, actionLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
      style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>{icon}</div>
    <div>
      <p className="text-base font-bold text-white mb-1">{title}</p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
    </div>
    {onAction && <Button variant="primary" size="md" onClick={onAction}>{actionLabel}</Button>}
  </div>
);

// ─── ChartItemsTable — shared between ReviewModal and analytics ───────────────
/**
 * Renders the items table exactly matching the PDF behaviour report layout:
 * grouped by category, each row shows item name and ✓ / ✗ value.
 */
const ChartItemsTable = ({ grouped }) => {
  if (!grouped?.length) return (
    <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.35)' }}>No item data available</p>
  );

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      {grouped.map(({ categoryName, items }) => (
        <div key={categoryName}>
          {/* Category header */}
          <div className="px-4 py-2"
            style={{ background: 'rgba(124,58,237,0.14)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-black text-violet-300 uppercase tracking-widest">{categoryName}</p>
          </div>
          {/* Items */}
          {items.map((entry, idx) => (
            <div key={entry.care_item ?? idx}
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: entry.value ? 'rgba(239,68,68,0.06)' : 'transparent',
              }}>
              <p className="text-sm" style={{ color: entry.value ? '#fca5a5' : 'rgba(255,255,255,0.65)' }}>
                {entry.item_name}
              </p>
              <span
                className="text-sm font-black px-3 py-1 rounded-lg shrink-0 ml-4"
                style={entry.value ? {
                  background: 'rgba(239,68,68,0.2)', color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.35)',
                } : {
                  background: 'rgba(16,185,129,0.12)', color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}
              >
                {entry.value ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryModal = ({ cat, onClose, onSuccess, saving, saveError, setSaveError, onSave }) => {
  const isEdit = !!cat;
  const [name, setName] = useState(cat?.name ?? '');
  const [err, setErr]   = useState('');

  const submit = async () => {
    if (!name.trim()) { setErr('Category name is required'); return; }
    const result = await onSave({ name: name.trim() }, cat?.id);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title={isEdit ? 'Edit Category' : 'New Category'}
      subtitle={isEdit ? `Editing: ${cat.name}` : 'Create a new care category'} onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />
        <DarkInput label="Category Name *" placeholder="e.g. Resistive Behaviours"
          value={name}
          onChange={e => { setName(e.target.value); setErr(''); if (saveError) setSaveError(null); }}
          error={err}
          hint="This becomes a section header on the daily care chart" />
        {isEdit && name.trim() !== cat.name && <UnsavedBadge visible />}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving}
            disabled={isEdit && name.trim() === cat.name} onClick={submit}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

const CategoriesTab = () => {
  const { categories, loading, error, saving, saveError, setSaveError, create, update, refetch } = useCategories();
  const { items: allItems } = useCareItems();
  const [modal, setModal]   = useState(null);
  const [search, setSearch] = useState('');

  const filtered     = categories.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
  const itemCountFor = catId => allItems.filter(i => String(i.category) === String(catId)).length;
  const handleSave   = async (payload, id) => id ? update(id, payload) : create(payload);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search categories…" />
        <Button variant="primary" size="md" onClick={() => setModal('create')} className="shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Category
        </Button>
      </div>
      {loading && <LoadingState label="Loading categories…" />}
      {!loading && error && <div className="text-center py-10"><p className="text-red-400 text-sm">{error}</p><Button variant="ghost" size="sm" onClick={refetch} className="mt-3">Retry</Button></div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon="🗂️" title={search ? 'No categories match' : 'No categories yet'}
          sub={search ? 'Try a different search' : 'Create care categories — they become sections on the daily chart'}
          onAction={!search ? () => setModal('create') : null} actionLabel="New Category" />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cat, i) => (
            <div key={cat.id}
              className="group relative rounded-2xl p-5 transition-all duration-250 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              onClick={() => setModal(cat)}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.08)'; e.currentTarget.style.border='1px solid rgba(124,58,237,0.3)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(124,58,237,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.07)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                style={{ background: `linear-gradient(90deg,hsl(${(i*47)%360},70%,65%),hsl(${(i*47+60)%360},70%,65%))` }} />
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
                  style={{ background: `linear-gradient(135deg,hsl(${(i*47)%360},65%,50%),hsl(${(i*47+60)%360},65%,50%))` }}>
                  {cat.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="opacity-0 group-hover:opacity-100 text-xs text-violet-400 transition-opacity">Edit →</span>
              </div>
              <p className="font-bold text-white text-sm">{cat.name}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {itemCountFor(cat.id)} item{itemCountFor(cat.id) !== 1 ? 's' : ''} · {fmt(cat.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
      {(modal === 'create' || (modal && modal !== 'create')) && (
        <CategoryModal cat={modal === 'create' ? null : modal}
          onClose={() => { setModal(null); setSaveError(null); }}
          onSuccess={() => { setModal(null); setSaveError(null); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError} onSave={handleSave} />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — CARE ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

const CareItemModal = ({ item, categories, onClose, onSuccess, saving, saveError, setSaveError, onSave }) => {
  const isEdit = !!item;
  const [form, setForm] = useState({ name: item?.name ?? '', category: item?.category ?? '', is_active: item?.is_active ?? true });
  const [errs, setErrs] = useState({});
  const catOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const set = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrs(p => ({ ...p, [k]: undefined })); };

  const submit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.category)    e.category = 'Select a category';
    if (Object.keys(e).length) { setErrs(e); return; }
    const result = await onSave({ name: form.name.trim(), category: form.category, is_active: form.is_active }, item?.id);
    if (result.success) onSuccess();
  };

  const hasChanges = isEdit && (
    form.name !== (item?.name ?? '') ||
    String(form.category) !== String(item?.category ?? '') ||
    form.is_active !== (item?.is_active ?? true)
  );

  return (
    <ModalShell title={isEdit ? 'Edit Care Item' : 'New Care Item'}
      subtitle={isEdit ? `Editing: ${item.name}` : 'Add an item to a care category'} onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />
        <DarkSelect label="Category *" value={form.category} onChange={set('category')}
          options={catOptions} placeholder="Select category…" error={errs.category}
          hint="Items are grouped under their category on the daily chart" />
        <DarkInput label="Item Name *" placeholder="e.g. Meals, Shower, Medication"
          value={form.name} onChange={set('name')} error={errs.name} />
        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <p className="text-sm font-semibold text-white">Active</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Inactive items won't appear on the daily chart</p>
          </div>
          <button type="button" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
            className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-300"
            style={{ background: form.is_active ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.15)' }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm"
              style={{ left: form.is_active ? '22px' : '2px' }} />
          </button>
        </div>
        <UnsavedBadge visible={hasChanges} />
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving}
            disabled={isEdit && !hasChanges} onClick={submit}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Item'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

const CareItemsTab = () => {
  const { categories } = useCategories();
  const [catFilter, setCatFilter] = useState('');
  const { items, loading, error, saving, saveError, setSaveError, create, update, refetch } = useCareItems(catFilter || null);
  const [modal, setModal]   = useState(null);
  const [search, setSearch] = useState('');

  const filtered   = items.filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.category_name?.toLowerCase().includes(search.toLowerCase()));
  const handleSave = async (payload, id) => id ? update(id, payload) : create(payload);
  const catOptions = [{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search care items…" />
        <div className="flex gap-2 shrink-0">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}>
            {catOptions.map(o => <option key={o.value} value={o.value} style={{ background: '#130d2e', color: '#fff' }}>{o.label}</option>)}
          </select>
          <Button variant="primary" size="md" onClick={() => setModal('create')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Item
          </Button>
        </div>
      </div>
      {loading && <LoadingState label="Loading care items…" />}
      {!loading && error && <div className="text-center py-10"><p className="text-red-400 text-sm">{error}</p><Button variant="ghost" size="sm" onClick={refetch} className="mt-3">Retry</Button></div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon="💊" title={search || catFilter ? 'No items match' : 'No care items yet'}
          sub={search || catFilter ? 'Try adjusting your filters' : 'Create items to appear on caregivers\' daily chart'}
          onAction={!search && !catFilter ? () => setModal('create') : null} actionLabel="New Item" />
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="col-span-5">Item Name</div><div className="col-span-4">Category</div>
            <div className="col-span-2">Status</div><div className="col-span-1" />
          </div>
          {filtered.map((item, i) => (
            <div key={item.id}
              className="grid grid-cols-12 gap-3 px-5 py-3.5 cursor-pointer transition-all duration-150 items-center"
              style={{ borderTop: i===0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
              onClick={() => setModal(item)}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
              <div className="col-span-5"><p className="text-sm font-bold text-white">{item.name}</p></div>
              <div className="col-span-4"><p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.category_name || '—'}</p></div>
              <div className="col-span-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                  style={item.is_active
                    ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                    : { background: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.25)' }}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
      {(modal === 'create' || (modal && modal !== 'create')) && (
        <CareItemModal item={modal === 'create' ? null : modal} categories={categories}
          onClose={() => { setModal(null); setSaveError(null); }}
          onSuccess={() => { setModal(null); setSaveError(null); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError} onSave={handleSave} />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW MODAL — fetches full chart detail, shows items table, then decision
// ═══════════════════════════════════════════════════════════════════════════════

const ReviewModal = ({ chart, residentName, onClose, onSuccess, saving, saveError, setSaveError, reviewChart, fetchChartDetail, allCareItems, categories }) => {
  const [action, setAction]         = useState('');
  const [reason, setReason]         = useState('');
  const [reasonErr, setReasonErr]   = useState('');
  const [detail, setDetail]         = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError]     = useState('');

  // Fetch chart detail on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setDetailLoading(true);
      const result = await fetchChartDetail(chart.resident, chart.date);
      if (cancelled) return;
      if (result.success) {
        setDetail(result.data);
      } else {
        setDetailError(result.error ?? 'Could not load chart items.');
      }
      setDetailLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [chart.id]);

  const grouped = useMemo(() => {
    if (!detail?.items) return [];
    return groupChartItemsByCategory(detail.items, allCareItems, categories);
  }, [detail, allCareItems, categories]);

  const submit = async () => {
    if (action === 'rejected' && !reason.trim()) { setReasonErr('A rejection reason is required'); return; }
    const result = await reviewChart(chart.id, action, reason);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Review Care Chart" subtitle={`${residentName} · ${fmt(chart.date)}`} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-5">
        <ErrorBanner message={saveError} />

        {/* Summary meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Resident', residentName], ['Date', fmt(chart.date)], ['Branch', chart.branch_name || '—'], ['Status', chart.status]].map(([l, v]) => (
            <div key={l} className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              <p className="text-sm font-semibold text-white capitalize">{v}</p>
            </div>
          ))}
        </div>

        {/* Items table */}
        <div>
          <SectionLabel icon="📋" title="Charted Items" />
          {detailLoading && (
            <div className="flex items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 rounded-lg animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading chart items…</p>
            </div>
          )}
          {!detailLoading && detailError && (
            <p className="text-sm text-red-400 text-center py-4">{detailError}</p>
          )}
          {!detailLoading && !detailError && (
            <ChartItemsTable grouped={grouped} />
          )}
        </div>

        {/* Decision */}
        <div>
          <SectionLabel icon="⚖️" title="Decision" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'approved', label: '✓ Approve', color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', activeBg: 'rgba(16,185,129,0.28)' },
              { id: 'rejected', label: '✕ Reject',  color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  activeBg: 'rgba(239,68,68,0.25)'  },
            ].map(opt => (
              <button key={opt.id} onClick={() => { setAction(opt.id); setReasonErr(''); }}
                className="py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: action === opt.id ? opt.activeBg : opt.bg,
                  border: `2px solid ${action === opt.id ? opt.color : opt.border}`,
                  color: opt.color,
                  boxShadow: action === opt.id ? `0 4px 16px ${opt.border}` : 'none',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {action === 'rejected' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Rejection Reason *</label>
            <textarea rows={3} value={reason} onChange={e => { setReason(e.target.value); setReasonErr(''); }}
              placeholder="Explain why this chart is being rejected…"
              className="w-full text-sm rounded-xl px-4 py-3 transition-all focus:outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }} />
            {reasonErr && <p className="text-xs text-red-400">{reasonErr}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} disabled={!action || saving} onClick={submit}>
            {saving ? 'Submitting…' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD MODAL — uses shared utils
// ═══════════════════════════════════════════════════════════════════════════════

const DownloadModal = ({ onClose, residents, categories, allItems, fetchChartDetail, charts }) => {
  const [residentId, setResidentId] = useState('');
  const [year,  setYear]            = useState(new Date().getFullYear());
  const [month, setMonth]           = useState(new Date().getMonth() + 1);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');

  const residentOptions = residents.map(r => ({ value: r.id, label: `${r.first_name} ${r.last_name}` }));
  const monthOptions    = Array.from({ length: 12 }, (_, i) => ({ value: i+1, label: new Date(2000,i,1).toLocaleString('en-KE',{month:'long'}) }));
  const yearOptions     = [-1,0,1].map(o => { const y=new Date().getFullYear()+o; return { value:y, label:String(y) }; });

  const handleDownload = async () => {
    if (!residentId) { setErr('Select a resident'); return; }
    setErr('');
    setLoading(true);

    const resident    = residents.find(r => String(r.id) === String(residentId));
    const daysInMonth = new Date(year, month, 0).getDate();

    // Only fetch days that have a chart submission (avoids 31 API calls)
    const chartsForResident = charts.filter(c =>
      String(c.resident) === String(residentId) &&
      c.date?.startsWith(`${year}-${String(month).padStart(2,'0')}`)
    );
    const daysWithCharts = new Set(
      chartsForResident.map(c => parseInt(c.date.split('-')[2], 10))
    );

    const chartsWithItems = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (!daysWithCharts.has(day)) continue;
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const result  = await fetchChartDetail(residentId, dateStr);
      if (result.success && result.data) {
        chartsWithItems.push({ date: dateStr, items: result.data.items ?? [] });
      }
    }

    const { grouped, days } = buildMonthlyReportData({
      charts: chartsWithItems, allCareItems: allItems, categories, year, month,
    });

    // Build the resident object with branch info for the PDF header
    const residentWithBranch = {
      ...resident,
      branch_name: chartsForResident[0]?.branch_name ?? resident.branch_name ?? '',
    };

    await generateBehaviorReportPDF({
      resident:     residentWithBranch,
      grouped,
      days,
      month,
      year,
      facilityName: chartsForResident[0]?.branch_name ?? '',
      orgName:      'Amazing Brothers Adult Family Home',
    });

    setLoading(false);
    onClose();
  };

  return (
    <ModalShell title="Download Monthly Report" subtitle="Export monthly behavior report as PDF" onClose={onClose}>
      <div className="space-y-4">
       
        <ErrorBanner message={err} />
        <DarkSelect label="Resident *" value={residentId}
          onChange={e => { setResidentId(e.target.value); setErr(''); }}
          options={residentOptions} placeholder="Select resident…" />
        <div className="grid grid-cols-2 gap-3">
          <DarkSelect label="Month" value={month} onChange={e => setMonth(Number(e.target.value))} options={monthOptions} />
          <DarkSelect label="Year"  value={year}  onChange={e => setYear(Number(e.target.value))}  options={yearOptions} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={loading} onClick={handleDownload}>
            {loading ? 'Building PDF…' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const AnalyticsPanel = ({ charts, allCareItems, residents }) => {
  const [residentId, setResidentId] = useState('');

  const residentOptions = [
    { value: '', label: 'All Residents' },
    ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
  ];

  const filteredCharts = useMemo(() =>
    residentId ? charts.filter(c => String(c.resident) === residentId) : charts,
    [charts, residentId]
  );

  // We only have list-level charts (no items). Analytics runs on charts that
  // DO have items embedded (from detail fetches). For the list view we approximate
  // using frequency based on chart existence per day. When full items are present
  // (e.g. after reviewing), they flow through automatically.
  const chartsWithItems = useMemo(() => filteredCharts.filter(c => c.items?.length), [filteredCharts]);

  const frequency = useMemo(() => computeItemFrequency(chartsWithItems, allCareItems), [chartsWithItems, allCareItems]);
  const patterns  = useMemo(() => detectPatterns(chartsWithItems, allCareItems), [chartsWithItems, allCareItems]);

  const daysSubmitted = filteredCharts.length;
  const obsRate       = (f) => `${Math.round(f.rate * 100)}%`;

  const BAR_COLORS = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee',
    '#60a5fa', '#a78bfa', '#f472b6',
  ];

  if (!daysSubmitted) return (
    <div className="rounded-2xl p-6 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
        No chart data available for analysis yet.
      </p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Resident filter */}
      <div className="flex items-center gap-3">
        <select value={residentId} onChange={e => setResidentId(e.target.value)}
          className="text-sm rounded-xl px-4 py-2.5 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}>
          {residentOptions.map(o => (
            <option key={o.value} value={o.value} style={{ background: '#130d2e', color: '#fff' }}>{o.label}</option>
          ))}
        </select>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {daysSubmitted} chart{daysSubmitted !== 1 ? 's' : ''} · {chartsWithItems.length} with full detail
        </span>
      </div>

      {/* Summary cards */}
      {patterns.notes.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'High Frequency', count: patterns.high.length,      color: '#f87171', bg: 'rgba(239,68,68,0.12)',  icon: '⚠️', tip: '≥70% of days' },
            { label: 'Emerging',       count: patterns.emerging.length,   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', icon: '📈', tip: 'Increasing recently' },
            { label: 'Improving',      count: patterns.improving.length,  color: '#34d399', bg: 'rgba(16,185,129,0.12)', icon: '📉', tip: 'Decreasing recently' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
              <div className="flex items-start justify-between mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-2xl font-black" style={{ color: s.color }}>{s.count}</span>
              </div>
              <p className="text-sm font-bold" style={{ color: s.color }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: s.color + 'aa' }}>{s.tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* Frequency bar chart */}
      {chartsWithItems.length > 0 && frequency.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 className="text-sm font-bold text-white">Behaviour Frequency</h4>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              % of submitted days each behaviour was observed (Yes). Based on {chartsWithItems.length} charted day(s).
            </p>
          </div>
          <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {frequency.map((f, i) => {
              const pct   = Math.round(f.rate * 100);
              const color = f.rate >= 0.7 ? '#f87171' : f.rate >= 0.4 ? '#fbbf24' : '#34d399';
              return (
                <div key={f.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate mr-2" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: '65%' }}>
                      {f.name}
                    </span>
                    <span className="font-black shrink-0" style={{ color }}>
                      {pct}% <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({f.observed}/{f.total})</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color, boxShadow: pct > 0 ? `0 0 6px ${color}60` : 'none' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High frequency alert list */}
      {patterns.high.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            <span>⚠️</span>
            <p className="text-sm font-bold text-red-400">Behaviours observed on 70%+ of days</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(239,68,68,0.1)' }}>
            {patterns.high.map(f => (
              <div key={f.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-white">{f.name}</p>
                <span className="text-xs font-black text-red-400">{obsRate(f)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartsWithItems.length === 0 && (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Detailed behaviour analytics are available after charts have been reviewed.
            Review some charts above to populate item-level data.
          </p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — CARE CHARTS
// ═══════════════════════════════════════════════════════════════════════════════

const ChartsTab = ({ residents, categories, allItems }) => {
  const { charts, loading, error, saving, saveError, setSaveError, reviewChart, fetchChartDetail, refetch } = useCareCharts();
  const [reviewTarget, setReviewTarget] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );
  const getName = c => c.resident_name || residentMap[String(c.resident)] || 'Unknown';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return charts.filter(c => {
      const matchSearch = !q || getName(c).toLowerCase().includes(q) || c.branch_name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [charts, search, statusFilter, residentMap]);

  const counts = useMemo(() => ({
    pending:  charts.filter(c => c.status === 'pending').length,
    approved: charts.filter(c => c.status === 'approved').length,
    rejected: charts.filter(c => c.status === 'rejected').length,
  }), [charts]);

  return (
    <div className="space-y-4">
      {/* Count cards */}
      {!loading && charts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending Review', value: counts.pending,  meta: STATUS_META.pending,  filter: 'pending'  },
            { label: 'Approved',       value: counts.approved, meta: STATUS_META.approved, filter: 'approved' },
            { label: 'Rejected',       value: counts.rejected, meta: STATUS_META.rejected, filter: 'rejected' },
          ].map(s => (
            <div key={s.label}
              className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: statusFilter === s.filter ? `1px solid ${s.meta.border}` : '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => setStatusFilter(statusFilter === s.filter ? 'all' : s.filter)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 8px 24px ${s.meta.bg}`; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${s.meta.color},${s.meta.color}60)` }} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.meta.color }} />
                <span style={{ color: s.meta.color }}>{s.label}</span>
                {s.label === 'Pending Review' && s.value > 0 && <span className="animate-pulse">⚠️</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-2 items-center flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by resident or branch…" />
        <div className="flex gap-1.5 shrink-0 flex-wrap">
          {['all','pending','approved','rejected'].map(f => {
            const meta = STATUS_META[f];
            return (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                style={statusFilter === f ? {
                  background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: meta ? meta.color : '#fff', border: `1px solid ${meta ? meta.border : 'transparent'}`,
                } : {
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                }}>
                {f === 'all' ? 'All' : meta.label}
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(v => !v)} className="shrink-0">
          📊 {showAnalytics ? 'Hide' : 'Analytics'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowDownload(true)} className="shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Monthly Report
        </Button>
      </div>

      {/* Analytics panel (collapsible) */}
      {showAnalytics && (
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
            <h3 className="text-sm font-bold text-white">Behaviour Analytics</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Patterns derived from reviewed care charts
            </p>
          </div>
          <div className="p-5">
            <AnalyticsPanel charts={charts} allCareItems={allItems} residents={residents} />
          </div>
        </div>
      )}

      {loading && <LoadingState label="Loading care charts…" />}
      {!loading && error && <div className="text-center py-10"><p className="text-red-400 text-sm">{error}</p><Button variant="ghost" size="sm" onClick={refetch} className="mt-3">Retry</Button></div>}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon="📊" title="No charts found"
          sub={search || statusFilter !== 'all' ? 'Try different filters' : 'Charts submitted by caregivers will appear here for review'} />
      )}

      {/* Chart table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="col-span-4">Resident</div><div className="col-span-2">Date</div>
            <div className="col-span-2">Branch</div><div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {filtered.map((chart, i) => {
            const meta = STATUS_META[chart.status] ?? STATUS_META.pending;
            const name = getName(chart);
            return (
              <div key={chart.id}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 transition-all duration-150 items-center"
                style={{ borderTop: i===0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
                <div className="col-span-4">
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Submitted {fmt(chart.created_at)}</p>
                </div>
                <div className="col-span-2"><p className="text-sm text-white">{fmt(chart.date)}</p></div>
                <div className="col-span-2"><p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{chart.branch_name || '—'}</p></div>
                <div className="col-span-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                    {meta.label}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end">
                  {chart.status === 'pending' ? (
                    <Button variant="primary" size="sm" onClick={() => setReviewTarget(chart)}>Review</Button>
                  ) : (
                    <button onClick={() => setReviewTarget(chart)}
                      className="text-xs font-semibold transition-colors"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                      onMouseEnter={e => { e.currentTarget.style.color='#a78bfa'; }}
                      onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.3)'; }}>
                      Re-review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          chart={reviewTarget} residentName={getName(reviewTarget)}
          onClose={() => { setReviewTarget(null); setSaveError(null); }}
          onSuccess={() => { setReviewTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          reviewChart={reviewChart} fetchChartDetail={fetchChartDetail}
          allCareItems={allItems} categories={categories}
        />
      )}

      {showDownload && (
        <DownloadModal
          onClose={() => setShowDownload(false)}
          residents={residents} categories={categories}
          allItems={allItems} fetchChartDetail={fetchChartDetail}
          charts={charts}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'categories', label: 'Categories', icon: '🗂️', desc: 'Manage care categories' },
  { id: 'items',      label: 'Care Items',  icon: '💊', desc: 'Items displayed on the daily chart' },
  { id: 'charts',     label: 'Care Charts', icon: '📊', desc: 'Review submitted daily charts & download reports' },
];

const Care = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const { residents }             = useResidents();
  const { categories }            = useCategories();
  const { items: allItems }       = useCareItems();
  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Care Management" pageSubtitle="Categories, items, and daily chart review">
      <div className="space-y-5 animate-slide-up">
        <div className="flex gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={activeTab === tab.id ? {
                background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(168,85,247,0.2))',
                color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 4px 16px rgba(124,58,237,0.15)',
              } : { color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }}>
              <span className="text-base leading-none">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <div>
            <h2 className="text-base font-black text-white">{current.label}</h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{current.desc}</p>
          </div>
        </div>
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'items'      && <CareItemsTab />}
        {activeTab === 'charts'     && <ChartsTab residents={residents} categories={categories} allItems={allItems} />}
      </div>
    </DashboardLayout>
  );
};

export default Care;