import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useVitals from '../../hooks/useVitals';
import useResidents from '../../hooks/useResidents';
import { ModalShell, ErrorBanner, DarkSelect } from '../../components/ui/FormComponents';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'  },
  approved: { label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  declined: { label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'   },
  updated:  { label: 'Updated',  color: '#a78bfa', bg: 'rgba(124,58,237,0.15)',  border: 'rgba(124,58,237,0.3)'  },
};

// ─── Vital value badge ────────────────────────────────────────────────────────

const VitalBadge = ({ label, value, unit = '' }) => (
  <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl"
    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
    <p className="text-[10px] uppercase tracking-wider font-semibold"
      style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
    <p className="text-sm font-black text-white">
      {value ?? '—'}{unit && value != null ? ` ${unit}` : ''}
    </p>
  </div>
);

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal = ({ vital, residentName, onClose, onSuccess, saving, saveError, setSaveError, reviewVital }) => {
  const [action, setAction]         = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [reasonErr, setReasonErr]   = useState('');

  const submit = async () => {
    if (action === 'declined' && !declineReason.trim()) {
      setReasonErr('Please provide a reason for declining'); return;
    }
    const result = await reviewVital(vital.id, action, declineReason);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Review Vital Record"
      subtitle={`${residentName} · ${fmt(vital.date_taken)}`}
      onClose={onClose}>
      <div className="space-y-5">
        <ErrorBanner message={saveError} />

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Resident', residentName],
            ['Date',     fmt(vital.date_taken)],
            ['Status',   vital.status],
            ['Submitted', fmt(vital.created_at)],
          ].map(([l, v]) => (
            <div key={l} className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              <p className="text-sm font-semibold text-white capitalize">{v}</p>
            </div>
          ))}
        </div>

        {/* Vital readings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <VitalBadge label="Blood Pressure" value={vital.blood_pressure} />
          <VitalBadge label="Temperature"    value={vital.temperature}    unit="°F" />
          <VitalBadge label="Pulse"          value={vital.pulse}          unit="bpm" />
          <VitalBadge label="O₂ Saturation"  value={vital.oxygen_saturation} unit="%" />
        </div>

        {vital.pain && (
          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Pain / Notes</p>
            <p className="text-sm text-white">{vital.pain}</p>
          </div>
        )}

        {vital.reason_edited && (
          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <p className="text-xs font-semibold mb-1 text-violet-400">Edit Reason</p>
            <p className="text-sm text-white">{vital.reason_edited}</p>
          </div>
        )}

        {/* Decision */}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: 'rgba(255,255,255,0.35)' }}>⚖️ &nbsp;Decision</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'approved', label: '✓ Approve', color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', activeBg: 'rgba(16,185,129,0.28)' },
              { id: 'declined', label: '✕ Decline', color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  activeBg: 'rgba(239,68,68,0.25)'  },
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

        {action === 'declined' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Decline Reason *
            </label>
            <textarea rows={3} value={declineReason}
              onChange={e => { setDeclineReason(e.target.value); setReasonErr(''); }}
              placeholder="Explain why this vital record is being declined…"
              className="w-full text-sm rounded-xl px-4 py-3 transition-all focus:outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
                color: '#fff', colorScheme: 'dark',
              }}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }} />
            {reasonErr && <p className="text-xs text-red-400">{reasonErr}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving}
            disabled={!action || saving} onClick={submit}>
            {saving ? 'Submitting…' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ManagerVitals = () => {
  const { vitals, loading, error, saving, saveError, setSaveError, reviewVital, refetch } = useVitals();
  const { residents } = useResidents();
  const [reviewTarget, setReviewTarget] = useState(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [residentFilter, setResidentFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );
  const getName = v => v.resident_name ?? residentMap[String(v.resident)] ?? 'Unknown';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vitals.filter(v => {
      const name = getName(v);
      const matchSearch   = !q || name.toLowerCase().includes(q) || v.date_taken?.includes(q);
      const matchStatus   = statusFilter === 'all' || v.status === statusFilter;
      const matchResident = !residentFilter || String(v.resident) === residentFilter;
      return matchSearch && matchStatus && matchResident;
    });
  }, [vitals, search, statusFilter, residentFilter, residentMap]);

  const counts = useMemo(() => ({
    pending:  vitals.filter(v => v.status === 'pending').length,
    approved: vitals.filter(v => v.status === 'approved').length,
    declined: vitals.filter(v => v.status === 'declined').length,
    updated:  vitals.filter(v => v.status === 'updated').length,
  }), [vitals]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const residentOptions = [
    { value: '', label: 'All Residents' },
    ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
  ];

  return (
    <DashboardLayout pageTitle="Vitals" pageSubtitle="Review and approve resident vital records">
      <div className="space-y-5 animate-slide-up">

        {/* Summary cards */}
        {!loading && vitals.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending Review', value: counts.pending,  meta: STATUS_META.pending,  filter: 'pending'  },
              { label: 'Approved',       value: counts.approved, meta: STATUS_META.approved, filter: 'approved' },
              { label: 'Declined',       value: counts.declined, meta: STATUS_META.declined, filter: 'declined' },
              { label: 'Updated',        value: counts.updated,  meta: STATUS_META.updated,  filter: 'updated'  },
            ].map(s => (
              <div key={s.label}
                className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: statusFilter === s.filter ? `1px solid ${s.meta.border}` : '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => { setStatusFilter(statusFilter === s.filter ? 'all' : s.filter); setPage(0); }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.meta.bg}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: `linear-gradient(90deg,${s.meta.color},${s.meta.color}60)` }} />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.meta.color }} />
                  <span style={{ color: s.meta.color }}>{s.label}</span>
                  {s.filter === 'pending' && s.value > 0 && <span className="animate-pulse">⚠️</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by resident or date…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; }} />
          </div>

          {/* Resident filter */}
          <select value={residentFilter}
            onChange={e => { setResidentFilter(e.target.value); setPage(0); }}
            className="text-sm rounded-xl px-3 py-2.5 focus:outline-none shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}>
            {residentOptions.map(o => (
              <option key={o.value} value={o.value} style={{ background: '#130d2e', color: '#fff' }}>{o.label}</option>
            ))}
          </select>

          {/* Status pills */}
          <div className="flex gap-1.5 shrink-0 flex-wrap">
            {['all', 'pending', 'approved', 'declined', 'updated'].map(f => {
              const meta = STATUS_META[f];
              return (
                <button key={f} onClick={() => { setStatusFilter(f); setPage(0); }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                  style={statusFilter === f
                    ? { background: meta?.bg ?? 'linear-gradient(135deg,#7c3aed,#a855f7)', color: meta?.color ?? '#fff', border: `1px solid ${meta?.border ?? 'transparent'}` }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {f === 'all' ? 'All' : meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading vitals…</p>
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
            <div className="text-5xl">❤️</div>
            <p className="text-base font-bold text-white">
              {search || statusFilter !== 'all' || residentFilter ? 'No records match' : 'No vital records yet'}
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Vitals submitted by caregivers will appear here for review.
            </p>
          </div>
        )}

        {!loading && !error && pageItems.length > 0 && (
          <>
            {/* Table */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="hidden lg:grid grid-cols-12 gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="col-span-3">Resident</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-2">BP</div>
                <div className="col-span-1">Temp</div>
                <div className="col-span-1">Pulse</div>
                <div className="col-span-1">O₂</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {pageItems.map((v, i) => {
                const meta = STATUS_META[v.status] ?? STATUS_META.pending;
                const name = getName(v);
                return (
                  <div key={v.id}
                    className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-all duration-150"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <div className="col-span-3">
                      <p className="text-sm font-bold text-white truncate">{name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Submitted {fmt(v.created_at)}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-white">{fmt(v.date_taken)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-white">{v.blood_pressure}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm text-white">{v.temperature}°</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm text-white">{v.pulse}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm text-white">{v.oxygen_saturation}%</p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs px-2 py-1 rounded-full font-bold"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {v.status === 'pending' || v.status === 'updated' ? (
                        <Button variant="primary" size="sm" onClick={() => setReviewTarget(v)}>Review</Button>
                      ) : (
                        <button onClick={() => setReviewTarget(v)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-30"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-white">{page + 1} / {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-30"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Review modal */}
        {reviewTarget && (
          <ReviewModal vital={reviewTarget} residentName={getName(reviewTarget)}
            onClose={() => { setReviewTarget(null); setSaveError(null); }}
            onSuccess={() => { setReviewTarget(null); setSaveError(null); refetch(); }}
            saving={saving} saveError={saveError} setSaveError={setSaveError}
            reviewVital={reviewVital} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManagerVitals;