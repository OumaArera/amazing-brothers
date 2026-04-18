import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { DarkSelect, ModalShell, ErrorBanner } from '../../components/ui/FormComponents';
import useGroceries from '../../hooks/useGroceries';
import useBranches from '../../hooks/useBranches';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  icon: '⏳' },
  approved:  { label: 'Approved',  color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  icon: '✅' },
  declined:  { label: 'Declined',  color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   icon: '❌' },
  fulfilled: { label: 'Fulfilled', color: '#a78bfa', bg: 'rgba(124,58,237,0.15)',  border: 'rgba(124,58,237,0.3)',  icon: '📦' },
};

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const Pill = ({ meta }) => (
  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
    {meta.label}
  </span>
);

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal = ({ req, branchName, onClose, onSuccess, saving, saveError, setSaveError, review }) => {
  const [action,    setAction]    = useState('');
  const [reason,    setReason]    = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const items    = req.items ?? [];
  const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const meta     = STATUS_META[req.status] ?? STATUS_META.pending;

  const ACTIONS = [
    { id: 'approve',  label: '✅ Approve',  next: 'approved',  show: req.status === 'pending'  },
    { id: 'decline',  label: '❌ Decline',  next: 'declined',  show: req.status === 'pending'  },
    { id: 'fulfill',  label: '📦 Fulfill',  next: 'fulfilled', show: req.status === 'approved' },
  ].filter(a => a.show);

  const needsReason = action === 'decline';

  const handleSubmit = async () => {
    if (needsReason && !reason.trim()) { setReasonErr('A decline reason is required'); return; }
    const result = await review(req.id, action, reason);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Review Grocery Request"
      subtitle={`${branchName} · ${fmt(req.created_at?.slice(0, 10))}`}
      onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        {/* Request meta */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{totalQty} units total · {branchName}</p>
          </div>
          <Pill meta={meta} />
        </div>

        {/* Items list */}
        <div className="rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-5">Notes / Brand</div>
          </div>
          {items.map((it, i) => (
            <div key={it.id ?? i}
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center"
              style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <div className="col-span-5 text-sm font-semibold text-white">{it.name}</div>
              <div className="col-span-2 text-center">
                <span className="text-xs font-black px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>
                  ×{it.quantity}
                </span>
              </div>
              <div className="col-span-5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {it.particulars || '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Decline reason if already declined */}
        {req.decline_reason && (
          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1 text-red-400">Decline Reason</p>
            <p className="text-sm text-red-300">{req.decline_reason}</p>
          </div>
        )}

        {/* Decision buttons */}
        {ACTIONS.length > 0 && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Decision</p>
              <div className="flex flex-col gap-2">
                {ACTIONS.map(a => {
                  const nextMeta = STATUS_META[a.next];
                  return (
                    <button key={a.id}
                      onClick={() => { setAction(a.id); setReason(''); setReasonErr(''); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left"
                      style={action === a.id ? {
                        background: nextMeta?.bg, border: `1px solid ${nextMeta?.border}`,
                        color: nextMeta?.color, boxShadow: `0 4px 16px ${nextMeta?.bg}`,
                      } : {
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)',
                      }}>
                      <span>{a.label}</span>
                      <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        → {nextMeta?.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {needsReason && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Decline Reason *
                </label>
                <textarea rows={3} value={reason}
                  onChange={e => { setReason(e.target.value); setReasonErr(''); }}
                  placeholder="Explain why this grocery request is being declined…"
                  className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
                  onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
                  onBlur={e => { e.target.style.border = reasonErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
                />
                {reasonErr && <p className="text-xs text-red-400">{reasonErr}</p>}
              </div>
            )}
          </>
        )}

        {ACTIONS.length === 0 && (
          <div className="px-4 py-3 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              This request is {meta.label.toLowerCase()} — no further actions available.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>
            {ACTIONS.length === 0 ? 'Close' : 'Cancel'}
          </Button>
          {ACTIONS.length > 0 && (
            <Button variant="primary" size="md" fullWidth loading={saving}
              disabled={!action || saving} onClick={handleSubmit}>
              {saving ? 'Updating…' : 'Confirm Decision'}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Request row in the table ─────────────────────────────────────────────────

const RequestRow = ({ req, branchName, onReview, i }) => {
  const meta     = STATUS_META[req.status] ?? STATUS_META.pending;
  const items    = req.items ?? [];
  const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);
  const isPending = req.status === 'pending';
  const isApproved = req.status === 'approved';
  const needsAction = isPending || isApproved;

  return (
    <div className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all"
      style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <div className="col-span-3">
        <p className="text-sm font-bold text-white truncate">{branchName}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{fmt(req.created_at?.slice(0, 10))}</p>
      </div>
      <div className="col-span-2 text-center">
        <p className="text-sm font-black text-white">{items.length}</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{totalQty} units</p>
      </div>
      <div className="col-span-4">
        {/* Item name preview — first 3 */}
        <div className="flex flex-wrap gap-1">
          {items.slice(0, 3).map((it, j) => (
            <span key={j} className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {it.name}
            </span>
          ))}
          {items.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-md"
              style={{ color: 'rgba(255,255,255,0.3)' }}>+{items.length - 3} more</span>
          )}
        </div>
      </div>
      <div className="col-span-1"><Pill meta={meta} /></div>
      <div className="col-span-2 flex justify-end">
        <Button variant={needsAction ? 'primary' : 'ghost'} size="sm" onClick={() => onReview(req)}>
          {needsAction ? (isPending ? 'Review' : 'Fulfill') : 'View'}
        </Button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ManagerGroceries = () => {
  const [reviewTarget, setReviewTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [search,       setSearch]       = useState('');

  const { requests, loading, error, saving, saveError, setSaveError, review, refetch } = useGroceries();
  const { branches } = useBranches();

  const branchMap = useMemo(() =>
    Object.fromEntries(branches.map(b => [String(b.id), b.name])),
    [branches]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(r =>
      (statusFilter  === 'all' || r.status === statusFilter) &&
      (branchFilter  === ''    || String(r.branch) === branchFilter) &&
      (!q || branchMap[String(r.branch)]?.toLowerCase().includes(q) ||
        r.items?.some(it => it.name.toLowerCase().includes(q)))
    );
  }, [requests, statusFilter, branchFilter, search, branchMap]);

  const counts = useMemo(() => ({
    pending:   requests.filter(r => r.status === 'pending').length,
    approved:  requests.filter(r => r.status === 'approved').length,
    declined:  requests.filter(r => r.status === 'declined').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
  }), [requests]);

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...branches.map(b => ({ value: String(b.id), label: b.name })),
  ];

  return (
    <DashboardLayout pageTitle="Grocery Requests" pageSubtitle="Review and manage grocery requests from all branches">
      <div className="space-y-5 animate-slide-up">

        {/* Pending alert banner */}
        {counts.pending > 0 && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <span className="text-xl">🛒</span>
            <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
              {counts.pending} grocery request{counts.pending !== 1 ? 's' : ''} waiting for approval
            </p>
          </div>
        )}

        {/* Summary cards */}
        {!loading && requests.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending',   value: counts.pending,   meta: STATUS_META.pending,   filter: 'pending'   },
              { label: 'Approved',  value: counts.approved,  meta: STATUS_META.approved,  filter: 'approved'  },
              { label: 'Declined',  value: counts.declined,  meta: STATUS_META.declined,  filter: 'declined'  },
              { label: 'Fulfilled', value: counts.fulfilled, meta: STATUS_META.fulfilled, filter: 'fulfilled' },
            ].map(s => (
              <div key={s.label}
                className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: statusFilter === s.filter ? `1px solid ${s.meta.border}` : '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setStatusFilter(statusFilter === s.filter ? 'all' : s.filter)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${s.meta.bg}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${s.meta.color},${s.meta.color}60)` }} />
                <div className="flex items-start justify-between">
                  <span className="text-xl">{s.meta.icon}</span>
                  <span className="text-2xl font-black text-white">{s.value}</span>
                </div>
                <p className="text-xs mt-1 font-semibold" style={{ color: s.meta.color }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by branch or item name…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              onFocus={e => { e.target.style.border='1px solid rgba(124,58,237,0.5)'; e.target.style.background='rgba(124,58,237,0.06)'; }}
              onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'declined', 'fulfilled'].map(f => {
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
            <div className="ml-auto w-44">
              <DarkSelect label="" value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                options={branchOptions} />
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
          </div>
        )}
        {!loading && error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-14 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-3xl mb-3">🛒</p>
            <p className="text-white/50 text-sm">No grocery requests submitted yet.</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && requests.length > 0 && (
          <div className="text-center py-10 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/50 text-sm">No requests match your filters.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="col-span-3">Branch / Date</div>
              <div className="col-span-2 text-center">Items</div>
              <div className="col-span-4">Contents Preview</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            {filtered.map((req, i) => (
              <RequestRow
                key={req.id} req={req} i={i}
                branchName={branchMap[String(req.branch)] ?? '—'}
                onReview={setReviewTarget}
              />
            ))}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          req={reviewTarget}
          branchName={branchMap[String(reviewTarget.branch)] ?? '—'}
          onClose={() => { setReviewTarget(null); setSaveError(null); }}
          onSuccess={() => { setReviewTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          review={review}
        />
      )}
    </DashboardLayout>
  );
};

export default ManagerGroceries;