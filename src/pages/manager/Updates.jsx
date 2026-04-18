import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { DarkSelect, ModalShell, ErrorBanner } from '../../components/ui/FormComponents';
import useUpdates from '../../hooks/useUpdates';
import useResidents from '../../hooks/useResidents';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = iso =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—';

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'  },
  approved: { label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  declined: { label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'   },
  updated:  { label: 'Updated',  color: '#60a5fa', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)'  },
};

const TYPE_META = {
  weekly:  { label: 'Weekly',  color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)' },
  monthly: { label: 'Monthly', color: '#f9a8d4', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)' },
};

const Pill = ({ meta }) => (
  <span className="text-xs px-2.5 py-1 rounded-full font-bold"
    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
    {meta.label}
  </span>
);

const SectionLabel = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <span>{icon}</span>
    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal = ({ update, residentName, onClose, onSuccess, saving, saveError, setSaveError, review }) => {
  const [action,  setAction]  = useState('');
  const [reason,  setReason]  = useState('');
  const [reasonErr, setReasonErr] = useState('');

  const deviation = update.weight_deviation;

  const handleSubmit = async () => {
    if (action === 'decline' && !reason.trim()) { setReasonErr('A decline reason is required'); return; }
    const result = await review(update.id, action, reason);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Review Update" subtitle={`${residentName} · ${fmt(update.date_taken)}`} onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        {/* Summary meta */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Resident',  residentName],
            ['Date',      fmt(update.date_taken)],
            ['Type',      TYPE_META[update.type]?.label ?? update.type],
            ['Caregiver', update.care_giver ?? '—'],
          ].map(([l, v]) => (
            <div key={l} className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              <p className="text-sm font-semibold text-white">{v}</p>
            </div>
          ))}
        </div>

        {/* Weight + deviation */}
        <div className="flex gap-3">
          <div className="flex-1 px-4 py-3 rounded-xl text-center"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Weight</p>
            <p className="text-xl font-black text-white">{update.weight} <span className="text-sm font-semibold">kg</span></p>
          </div>
          {deviation !== null && deviation !== undefined && (
            <div className="flex-1 px-4 py-3 rounded-xl text-center"
              style={{
                background: deviation > 0 ? 'rgba(16,185,129,0.12)' : deviation < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${deviation > 0 ? 'rgba(16,185,129,0.25)' : deviation < 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'}`,
              }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Change</p>
              <p className="text-xl font-black" style={{ color: deviation > 0 ? '#34d399' : deviation < 0 ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                {deviation > 0 ? '+' : ''}{Number(deviation).toFixed(1)} <span className="text-sm font-semibold">kg</span>
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <SectionLabel icon="📋" title="Notes" />
        <div className="px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm text-white/80 leading-relaxed">{update.notes}</p>
        </div>

        {/* Late reason if present */}
        {update.reason_filled_late && (
          <>
            <SectionLabel icon="⏰" title="Late Entry Reason" />
            <div className="px-4 py-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-sm text-amber-300">{update.reason_filled_late}</p>
            </div>
          </>
        )}

        {/* Decision */}
        <SectionLabel icon="⚖️" title="Decision" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'approve', label: '✓ Approve', color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', activeBg: 'rgba(16,185,129,0.28)' },
            { id: 'decline', label: '✕ Decline', color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  activeBg: 'rgba(239,68,68,0.25)'  },
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

        {/* Decline reason */}
        {action === 'decline' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Decline Reason *</label>
            <textarea rows={3} value={reason} onChange={e => { setReason(e.target.value); setReasonErr(''); }}
              placeholder="Explain why this update is being declined…"
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
            />
            {reasonErr && <p className="text-xs text-red-400">{reasonErr}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} disabled={!action || saving} onClick={handleSubmit}>
            {saving ? 'Submitting…' : 'Submit Decision'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Updates Tab ──────────────────────────────────────────────────────────────

const UpdatesTab = ({ updates, residents, loading, error, refetch, saving, saveError, setSaveError, review }) => {
  const [reviewTarget, setReviewTarget] = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [residentFilter, setResidentFilter] = useState('');

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );

  const getName = u => u.resident_name ?? residentMap[String(u.resident)] ?? 'Unknown';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return updates.filter(u =>
      (statusFilter    === 'all' || u.status === statusFilter) &&
      (typeFilter      === 'all' || u.type   === typeFilter) &&
      (residentFilter  === ''    || String(u.resident) === residentFilter) &&
      (!q || getName(u).toLowerCase().includes(q) || u.notes?.toLowerCase().includes(q) || u.care_giver?.toLowerCase().includes(q))
    );
  }, [updates, statusFilter, typeFilter, residentFilter, search, residentMap]);

  const counts = useMemo(() => ({
    pending:  updates.filter(u => u.status === 'pending').length,
    approved: updates.filter(u => u.status === 'approved').length,
    declined: updates.filter(u => u.status === 'declined').length,
  }), [updates]);

  const residentOptions = [
    { value: '', label: 'All Residents' },
    ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
  ];

  return (
    <div className="space-y-4">
      {/* Count cards */}
      {!loading && updates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',  value: counts.pending,  meta: STATUS_META.pending,  filter: 'pending'  },
            { label: 'Approved', value: counts.approved, meta: STATUS_META.approved, filter: 'approved' },
            { label: 'Declined', value: counts.declined, meta: STATUS_META.declined, filter: 'declined' },
          ].map(s => (
            <div key={s.label}
              className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: statusFilter === s.filter ? `1px solid ${s.meta.border}` : '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => setStatusFilter(statusFilter === s.filter ? 'all' : s.filter)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${s.meta.bg}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${s.meta.color},${s.meta.color}60)` }} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.meta.color }} />
                <span style={{ color: s.meta.color }}>{s.label}</span>
                {s.label === 'Pending' && s.value > 0 && <span className="animate-pulse">⚠️</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by resident, caregiver, or notes…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status */}
          {['all', 'pending', 'approved', 'declined', 'updated'].map(f => {
            const meta = STATUS_META[f];
            return (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={statusFilter === f ? {
                  background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: meta ? meta.color : '#fff', border: `1px solid ${meta ? meta.border : 'transparent'}`,
                } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                {f === 'all' ? 'All Status' : (meta?.label ?? f)}
              </button>
            );
          })}
          <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          {/* Type */}
          {['all', 'weekly', 'monthly'].map(f => {
            const meta = TYPE_META[f];
            return (
              <button key={f} onClick={() => setTypeFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={typeFilter === f ? {
                  background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: meta ? meta.color : '#fff', border: `1px solid ${meta ? meta.border : 'transparent'}`,
                } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                {f === 'all' ? 'All Types' : (meta?.label ?? f)}
              </button>
            );
          })}
          {/* Resident dropdown */}
          <select value={residentFilter} onChange={e => setResidentFilter(e.target.value)}
            className="text-xs rounded-xl px-3 py-1.5 focus:outline-none transition-all ml-auto"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}>
            {residentOptions.map(o => (
              <option key={o.value} value={o.value} style={{ background: '#130d2e' }}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
        </div>
      )}
      {!loading && error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-3xl mb-3">📋</p>
          <p className="text-white/50 text-sm">
            {updates.length === 0 ? 'No updates submitted yet.' : 'No updates match your filters.'}
          </p>
        </div>
      )}

      {/* Updates table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="col-span-3">Resident</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1 text-right">Weight</div>
            <div className="col-span-1 text-right">Δ</div>
            <div className="col-span-2">Caregiver</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          {filtered.map((u, i) => {
            const statusMeta = STATUS_META[u.status] ?? STATUS_META.pending;
            const typeMeta   = TYPE_META[u.type]     ?? TYPE_META.weekly;
            const name       = getName(u);
            const deviation  = u.weight_deviation;
            return (
              <div key={u.id}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all"
                style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div className="col-span-3">
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-white/60">{fmt(u.date_taken)}</p>
                </div>
                <div className="col-span-1">
                  <Pill meta={typeMeta} />
                </div>
                <div className="col-span-1 text-right">
                  <p className="text-sm font-bold text-white">{u.weight}kg</p>
                </div>
                <div className="col-span-1 text-right">
                  {deviation !== null && deviation !== undefined ? (
                    <p className="text-xs font-bold"
                      style={{ color: deviation > 0 ? '#34d399' : deviation < 0 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                      {deviation > 0 ? '+' : ''}{Number(deviation).toFixed(1)}
                    </p>
                  ) : <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>—</p>}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-white/50 truncate">{u.care_giver ?? '—'}</p>
                </div>
                <div className="col-span-1">
                  <Pill meta={statusMeta} />
                </div>
                <div className="col-span-1 flex justify-end">
                  {u.status === 'pending' ? (
                    <Button variant="primary" size="sm" onClick={() => setReviewTarget(u)}>Review</Button>
                  ) : (
                    <button onClick={() => setReviewTarget(u)}
                      className="text-xs font-semibold transition-colors"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}>
                      View
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
          update={reviewTarget} residentName={getName(reviewTarget)}
          onClose={() => { setReviewTarget(null); setSaveError(null); }}
          onSuccess={() => { setReviewTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          review={review}
        />
      )}
    </div>
  );
};

// ─── Weight Trend Tab ─────────────────────────────────────────────────────────

const WeightTrendTab = ({ updates, residents }) => {
  const [residentId, setResidentId] = useState('');

  const filtered = useMemo(() =>
    (residentId
      ? updates.filter(u => String(u.resident) === residentId)
      : []
    ).filter(u => u.status === 'approved' || u.status === 'updated')
     .sort((a, b) => a.date_taken.localeCompare(b.date_taken)),
    [updates, residentId]
  );

  const residentOptions = residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` }));

  // Weight range for normalising bars
  const weights  = filtered.map(u => u.weight);
  const minW     = weights.length ? Math.min(...weights) - 2 : 0;
  const maxW     = weights.length ? Math.max(...weights) + 2 : 100;
  const range    = maxW - minW || 1;

  // Trend insights
  const trendInsight = useMemo(() => {
    if (filtered.length < 2) return null;
    const first = filtered[0].weight;
    const last  = filtered[filtered.length - 1].weight;
    const diff  = last - first;
    const pct   = ((diff / first) * 100).toFixed(1);
    if (Math.abs(diff) < 0.5) return { icon: '➡️', color: '#a78bfa', text: `Weight stable over this period (${first}kg → ${last}kg).` };
    if (diff > 0) return { icon: diff > 3 ? '⚠️' : '📈', color: diff > 3 ? '#f87171' : '#34d399', text: `Weight increased by ${diff.toFixed(1)}kg (${pct}%) since first entry. ${diff > 3 ? 'Significant gain — check diet and mobility.' : 'Modest gain.'}` };
    return { icon: Math.abs(diff) > 3 ? '⚠️' : '📉', color: Math.abs(diff) > 3 ? '#f87171' : '#fbbf24', text: `Weight decreased by ${Math.abs(diff).toFixed(1)}kg (${pct}%) since first entry. ${Math.abs(diff) > 3 ? 'Significant loss — flag for clinical review.' : 'Modest decrease.'}` };
  }, [filtered]);

  return (
    <div className="space-y-5">
      <DarkSelect label="Select Resident" value={residentId}
        onChange={e => setResidentId(e.target.value)}
        options={[{ value: '', label: 'Select a resident…' }, ...residentOptions]} />

      {residentId && filtered.length === 0 && (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-3xl mb-3">⚖️</p>
          <p className="text-white/50 text-sm">No approved weight data yet for this resident.</p>
        </div>
      )}

      {residentId && filtered.length > 0 && (
        <>
          {/* Trend insight */}
          {trendInsight && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-lg shrink-0">{trendInsight.icon}</span>
              <p className="text-sm" style={{ color: trendInsight.color }}>{trendInsight.text}</p>
            </div>
          )}

          {/* Weight bar chart */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="text-sm font-bold text-white">Weight Over Time</h4>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Approved entries · Range {minW.toFixed(1)}–{maxW.toFixed(1)} kg
              </p>
            </div>
            <div className="px-5 py-4 space-y-2 max-h-80 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {filtered.map((u, i) => {
                const barPct  = ((u.weight - minW) / range) * 100;
                const devC    = u.weight_deviation > 0 ? '#f87171' : u.weight_deviation < 0 ? '#34d399' : 'rgba(255,255,255,0.3)';
                return (
                  <div key={u.id} className="flex items-center gap-3">
                    <span className="text-[10px] w-20 shrink-0 font-semibold"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(u.date_taken + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-5 rounded-md overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{
                        width: `${barPct}%`, height: '100%', minWidth: 8,
                        background: 'linear-gradient(90deg,#6366f1,#a78bfa)',
                        transition: 'width 0.4s',
                      }} />
                    </div>
                    <span className="text-xs w-14 shrink-0 text-right font-black" style={{ color: '#c4b5fd' }}>
                      {u.weight}kg
                    </span>
                    {u.weight_deviation !== null && u.weight_deviation !== undefined && (
                      <span className="text-[10px] w-12 shrink-0 text-right font-bold" style={{ color: devC }}>
                        {u.weight_deviation > 0 ? '+' : ''}{Number(u.weight_deviation).toFixed(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Current Weight',  value: `${filtered[filtered.length - 1].weight}kg`, color: '#c4b5fd', bg: 'rgba(124,58,237,0.12)' },
              { label: 'Lowest Recorded', value: `${Math.min(...weights).toFixed(1)}kg`,       color: '#34d399', bg: 'rgba(16,185,129,0.12)'  },
              { label: 'Highest Recorded',value: `${Math.max(...weights).toFixed(1)}kg`,       color: '#f87171', bg: 'rgba(239,68,68,0.12)'   },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center"
                style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
                <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: s.color + 'aa' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!residentId && (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-3xl mb-3">⚖️</p>
          <p className="text-white/50 text-sm">Select a resident to view their weight trend.</p>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'updates', label: 'Updates',      icon: '📋', desc: 'Review and approve resident updates' },
  { id: 'weight',  label: 'Weight Trend', icon: '⚖️', desc: 'Per-resident weight trend analysis'   },
];

const ManagerUpdates = () => {
  const [activeTab, setActiveTab] = useState('updates');
  const { residents }             = useResidents();
  const { updates, loading, error, saving, saveError, setSaveError, review, refetch } = useUpdates();
  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Resident Updates" pageSubtitle="Review, approve, and track resident update submissions">
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
        {activeTab === 'updates' && (
          <UpdatesTab updates={updates} residents={residents}
            loading={loading} error={error} refetch={refetch}
            saving={saving} saveError={saveError} setSaveError={setSaveError}
            review={review} />
        )}
        {activeTab === 'weight' && <WeightTrendTab updates={updates} residents={residents} />}
      </div>
    </DashboardLayout>
  );
};

export default ManagerUpdates;