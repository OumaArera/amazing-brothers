import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { useCategories, useCareItems, useCareCharts } from '../../hooks/useCare';
import useResidents from '../../hooks/useResidents';
import { DarkSelect, ErrorBanner } from '../../components/ui/FormComponents';

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  pending:  { label: 'Pending Review', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'  },
  approved: { label: 'Approved',       color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  rejected: { label: 'Rejected',       color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'   },
};

const UNSET = '';
const PAGE_SIZE = 5; // categories shown per page

// ─── Yes/No selector ─────────────────────────────────────────────────────────

const YesNoItem = ({ item, value, onChange, hasError }) => {
  const isYes = value === 'yes';
  const isNo  = value === 'no';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 ${hasError ? 'ring-1 ring-red-500/50' : ''}`}
      style={{
        background: isYes ? 'rgba(239,68,68,0.1)' : isNo ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
        border: isYes
          ? '1px solid rgba(239,68,68,0.3)'
          : isNo
          ? '1px solid rgba(16,185,129,0.25)'
          : hasError
          ? '1px solid rgba(239,68,68,0.4)'
          : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
        style={
          isYes ? { background: 'rgba(239,68,68,0.25)', color: '#f87171' }
          : isNo  ? { background: 'rgba(16,185,129,0.2)',  color: '#34d399' }
          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
        }
      >
        {isYes ? '✓' : isNo ? '✗' : '?'}
      </div>

      <p className="text-sm font-medium flex-1" style={{
        color: isYes ? '#fca5a5' : isNo ? '#6ee7b7' : 'rgba(255,255,255,0.65)',
      }}>
        {item.name}
      </p>

      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(isYes ? UNSET : 'yes')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
          style={isYes ? {
            background: 'rgba(239,68,68,0.3)', color: '#f87171',
            border: '1px solid rgba(239,68,68,0.5)', boxShadow: '0 0 8px rgba(239,68,68,0.25)',
          } : {
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >Yes</button>
        <button
          type="button"
          onClick={() => onChange(isNo ? UNSET : 'no')}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
          style={isNo ? {
            background: 'rgba(16,185,129,0.2)', color: '#34d399',
            border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 8px rgba(16,185,129,0.2)',
          } : {
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >No</button>
      </div>
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ answered, total }) => {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl"
      style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-semibold" style={{ color: '#a78bfa' }}>Items Answered</span>
          <span className="font-black text-white">{answered}/{total}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-1.5 rounded-full transition-all duration-400"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'linear-gradient(90deg,#7c3aed,#a855f7)',
            }} />
        </div>
        <div className="flex gap-4 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span><span className="text-red-400 font-bold">Yes (✓)</span> = behaviour observed</span>
          <span><span className="text-emerald-400 font-bold">No (✗)</span> = not observed</span>
        </div>
      </div>
      <span className="text-xl font-black shrink-0" style={{ color: pct === 100 ? '#10b981' : '#a78bfa' }}>
        {pct}%
      </span>
    </div>
  );
};

// ─── Category group component (collapsible + paginated) ───────────────────────

const CategoryGroup = ({ group, answers, setAnswer, touchedSubmit }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage]           = useState(0);

  const items        = group.items;
  const totalPages   = Math.ceil(items.length / PAGE_SIZE);
  const pageItems    = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const groupAnswered = items.filter(i => answers[i.id] && answers[i.id] !== UNSET).length;
  const groupComplete = groupAnswered === items.length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Category header — click to collapse */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
        style={{
          background: groupComplete ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.07)',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          {/* Collapse chevron */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 transition-transform duration-200 shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-sm font-black text-white">{group.categoryName}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: groupComplete ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.15)',
              color: groupComplete ? '#34d399' : '#a78bfa',
            }}
          >
            {groupAnswered}/{items.length}
          </span>
        </div>
        {groupComplete && <span className="text-xs font-bold text-emerald-400 shrink-0">✓ Complete</span>}
      </button>

      {/* Items — hidden when collapsed */}
      {!collapsed && (
        <div style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="p-3 space-y-2">
            {pageItems.map(item => (
              <YesNoItem
                key={item.id}
                item={item}
                value={answers[item.id] ?? UNSET}
                onChange={val => setAnswer(item.id, val)}
                hasError={touchedSubmit && !answers[item.id]}
              />
            ))}
          </div>

          {/* Pagination within category */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 pb-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Page {page + 1} of {totalPages} · {items.length} items
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Submit Chart Tab ─────────────────────────────────────────────────────────

const SubmitChartTab = ({ residents }) => {
  const { categories, loading: catLoading }        = useCategories();
  const { items: allItems, loading: itemsLoading } = useCareItems();
  const { saving, saveError, setSaveError, submitChart } = useCareCharts();

  const [resident, setResident]         = useState('');
  const [date, setDate]                 = useState(today());
  const [answers, setAnswers]           = useState({});
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [formErr, setFormErr]           = useState('');
  const [submitted, setSubmitted]       = useState(false);
  const [catPage, setCatPage]           = useState(0); // page through category groups

  const CAT_PAGE_SIZE = 3; // number of category groups shown at once

  const residentOptions = residents.map(r => ({
    value: String(r.id),
    label: `${r.first_name} ${r.last_name}`,
  }));

  /**
   * Group items by category.
   *
   * FIX: We no longer require the category to exist in the `categories` array.
   * Items carry `category` (id) and `category_name` from the API serialiser.
   * If `categories` hasn't loaded yet or the ID simply isn't in the list,
   * we fall back to item.category_name or the raw category ID — so every item
   * is always rendered, regardless of how many categories the manager has defined.
   */
  const grouped = useMemo(() => {
    const map = {};
    allItems.forEach(item => {
      const catId = String(item.category);
      if (!map[catId]) {
        // Prefer a match from the categories list; fall back to item's own category_name
        const catObj = categories.find(c => String(c.id) === catId);
        map[catId] = {
          catId,
          categoryName: catObj?.name ?? item.category_name ?? `Category ${catId}`,
          items: [],
        };
      }
      map[catId].items.push(item);
    });
    // Sort by category name alphabetically; no filtering — all groups always show
    return Object.values(map).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [allItems, categories]);

  const totalCatPages = Math.ceil(grouped.length / CAT_PAGE_SIZE);
  const visibleGroups = grouped.slice(catPage * CAT_PAGE_SIZE, (catPage + 1) * CAT_PAGE_SIZE);

  const totalItems    = allItems.length;
  const answeredCount = allItems.filter(i => answers[i.id] && answers[i.id] !== UNSET).length;
  const unansweredIds = allItems.filter(i => !answers[i.id]).map(i => i.id);
  const allAnswered   = unansweredIds.length === 0 && totalItems > 0;

  const setAnswer = (id, val) => {
    setAnswers(p => ({ ...p, [id]: val }));
    setFormErr('');
    if (saveError) setSaveError(null);
  };

  const handleSubmit = async () => {
    setTouchedSubmit(true);
    if (!resident)    { setFormErr('Please select a resident'); return; }
    if (!date)        { setFormErr('Please select a date'); return; }
    if (!allAnswered) {
      setFormErr(`${unansweredIds.length} item(s) still need a Yes or No response`);
      return;
    }
    setFormErr('');
    const items = allItems.map(item => ({
      care_item: item.id,
      value: answers[item.id] === 'yes',
    }));
    const result = await submitChart({ resident, date, items });
    if (result.success) {
      setSubmitted(true);
      setAnswers({});
      setTouchedSubmit(false);
      setCatPage(0);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>✅</div>
        <div>
          <p className="text-lg font-black text-white mb-1">Chart Submitted!</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            The daily care chart has been submitted for manager review.
          </p>
        </div>
        <Button variant="ghost" size="md" onClick={() => setSubmitted(false)}>Submit Another</Button>
      </div>
    );
  }

  if (catLoading || itemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
        <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading care items…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resident + Date */}
      <div className="grid sm:grid-cols-2 gap-4 p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <DarkSelect
          label="Resident *"
          value={resident}
          onChange={e => { setResident(e.target.value); setFormErr(''); if (saveError) setSaveError(null); }}
          options={residentOptions}
          placeholder="Select resident…"
          error={touchedSubmit && !resident ? 'Required' : ''}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Date *</label>
          <input type="date" value={date} max={today()}
            onChange={e => { setDate(e.target.value); setFormErr(''); }}
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
          />
        </div>
      </div>

      {totalItems > 0 && <ProgressBar answered={answeredCount} total={totalItems} />}

      <ErrorBanner message={saveError || formErr} />

      {/* No items yet */}
      {grouped.length === 0 && (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/50 text-sm mb-1">No active care items found.</p>
          <p className="text-white/30 text-xs">Ask your manager to add care categories and items first.</p>
        </div>
      )}

      {/* Category pagination controls — top */}
      {totalCatPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Categories {catPage * CAT_PAGE_SIZE + 1}–{Math.min((catPage + 1) * CAT_PAGE_SIZE, grouped.length)} of {grouped.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={catPage === 0}
              onClick={() => setCatPage(p => p - 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Page dots */}
            {Array.from({ length: totalCatPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCatPage(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: i === catPage ? '#a78bfa' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
            <button
              type="button"
              disabled={catPage >= totalCatPages - 1}
              onClick={() => setCatPage(p => p + 1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Visible category groups */}
      {visibleGroups.map(group => (
        <CategoryGroup
          key={group.catId}
          group={group}
          answers={answers}
          setAnswer={setAnswer}
          touchedSubmit={touchedSubmit}
        />
      ))}

      {/* Category pagination controls — bottom */}
      {totalCatPages > 1 && (
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            disabled={catPage === 0}
            onClick={() => setCatPage(p => p - 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
          >← Previous categories</button>
          <button
            type="button"
            disabled={catPage >= totalCatPages - 1}
            onClick={() => setCatPage(p => p + 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
          >Next categories →</button>
        </div>
      )}

      {/* Submit */}
      {grouped.length > 0 && (
        <div className="pt-2 space-y-3">
          {touchedSubmit && !allAnswered && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
              <span className="shrink-0">⚠️</span>
              <span>{unansweredIds.length} item(s) still need a Yes or No answer across all categories.</span>
            </div>
          )}
          <Button variant="primary" size="lg" fullWidth loading={saving} onClick={handleSubmit}>
            {saving
              ? 'Submitting chart…'
              : allAnswered
              ? 'Submit Chart'
              : `Answer remaining ${unansweredIds.length} item(s) to submit`}
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── My Charts Tab ────────────────────────────────────────────────────────────

const MyChartsTab = () => {
  const { charts, loading, error, refetch } = useCareCharts();
  const [statusFilter, setStatusFilter]     = useState('all');
  const [search, setSearch]                 = useState('');
  const [page, setPage]                     = useState(0);

  const LIST_PAGE_SIZE = 8;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return charts.filter(c => {
      const matchSearch = !q ||
        c.resident_name?.toLowerCase().includes(q) ||
        c.branch_name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [charts, search, statusFilter]);

  // Reset to page 0 when filters change
  useMemo(() => { setPage(0); }, [search, statusFilter]);

  const totalPages   = Math.ceil(filtered.length / LIST_PAGE_SIZE);
  const pageItems    = filtered.slice(page * LIST_PAGE_SIZE, (page + 1) * LIST_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search charts…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {['all', 'pending', 'approved', 'rejected'].map(f => {
            const meta = STATUS_META[f];
            return (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                style={statusFilter === f ? {
                  background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: meta ? meta.color : '#fff',
                  border: `1px solid ${meta ? meta.border : 'transparent'}`,
                } : {
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                }}>
                {f === 'all' ? 'All' : meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading charts…</p>
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={refetch} className="mt-3">Retry</Button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="text-5xl">📊</div>
          <p className="text-base font-bold text-white">
            {search || statusFilter !== 'all' ? 'No charts match' : "You haven't submitted any charts yet"}
          </p>
          {!search && statusFilter === 'all' && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Go to the "Submit Chart" tab to chart today's care
            </p>
          )}
        </div>
      )}

      {!loading && !error && pageItems.length > 0 && (
        <>
          <div className="space-y-3">
            {pageItems.map(chart => {
              const meta = STATUS_META[chart.status] ?? STATUS_META.pending;
              return (
                <div key={chart.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; e.currentTarget.style.border = '1px solid rgba(124,58,237,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'; }}>
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                    <p className="text-xs font-bold text-violet-400 leading-none">
                      {new Date(chart.date + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short' }).toUpperCase()}
                    </p>
                    <p className="text-base font-black text-white leading-none mt-0.5">
                      {new Date(chart.date + 'T00:00:00').getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{chart.resident_name || 'Resident'}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {chart.branch_name || '—'} · Submitted {fmt(chart.created_at)}
                    </p>
                    {chart.rejection_reason && (
                      <p className="text-xs mt-1 text-red-400">Reason: {chart.rejection_reason}</p>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold shrink-0"
                    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {page * LIST_PAGE_SIZE + 1}–{Math.min((page + 1) * LIST_PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
                >← Prev</button>
                <span className="px-3 py-1.5 text-xs font-bold text-white">
                  {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}
                >Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'submit',  label: 'Submit Chart', icon: '📝', desc: "Answer Yes/No for each care item" },
  { id: 'history', label: 'My Charts',    icon: '📊', desc: 'View your submitted charts and their status' },
];

const CaregiverCare = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const { residents }             = useResidents();
  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Care Charts" pageSubtitle="Submit and review daily care charts">
      <div className="space-y-5 animate-slide-up">
        <div className="flex gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={activeTab === tab.id ? {
                background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(168,85,247,0.2))',
                color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 4px 16px rgba(124,58,237,0.15)',
              } : {
                color: 'rgba(255,255,255,0.45)', border: '1px solid transparent',
              }}>
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
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
        {activeTab === 'submit'  && <SubmitChartTab residents={residents} />}
        {activeTab === 'history' && <MyChartsTab />}
      </div>
    </DashboardLayout>
  );
};

export default CaregiverCare;