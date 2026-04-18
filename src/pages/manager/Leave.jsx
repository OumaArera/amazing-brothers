import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { ModalShell, ErrorBanner } from '../../components/ui/FormComponents';
import { useAllLeave } from '../../hooks/useLeave';
import { useAuth } from '../../context/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const fmt = iso =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—';

const daysBetween = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end + 'T00:00:00') - new Date(start + 'T00:00:00');
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
};

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  icon: '⏳' },
  approved: { label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  icon: '✅' },
  declined: { label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   icon: '❌' },
};

// ─── Request Leave Modal (manager submitting their own) ───────────────────────

const RequestModal = ({ onClose, onSuccess, saving, saveError, setSaveError, create }) => {
  const [form, setForm] = useState({ start_date: '', end_date: '', reason_for_request: '' });
  const [errs, setErrs] = useState({});

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrs(p => ({ ...p, [k]: undefined }));
    if (saveError) setSaveError(null);
  };

  const duration = daysBetween(form.start_date, form.end_date);

  const validate = () => {
    const e = {};
    if (!form.start_date) e.start_date = 'Start date is required';
    if (!form.end_date)   e.end_date   = 'End date is required';
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = 'End date cannot be before start date';
    if (form.start_date && form.start_date < today())
      e.start_date = 'Start date cannot be in the past';
    if (!form.reason_for_request.trim()) e.reason_for_request = 'Please explain the reason for your leave';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const result = await create({
      start_date:         form.start_date,
      end_date:           form.end_date,
      reason_for_request: form.reason_for_request.trim(),
    });
    if (result.success) onSuccess();
  };

  const dateStyle = (hasErr) => ({
    background: 'rgba(255,255,255,0.07)',
    border: hasErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
    color: '#fff', colorScheme: 'dark',
  });

  return (
    <ModalShell title="Request Leave" subtitle="Your request will be reviewed by another manager" onClose={onClose}>
      <div className="space-y-4">
        {/* Self-approval notice */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <span className="shrink-0 mt-0.5">ℹ️</span>
          <p className="text-xs" style={{ color: '#c4b5fd' }}>
            As a manager, you cannot approve your own leave request. Another manager or administrator will review it.
          </p>
        </div>

        <ErrorBanner message={saveError} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Start Date *</label>
            <input type="date" value={form.start_date} min={today()} onChange={set('start_date')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={dateStyle(errs.start_date)}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = errs.start_date ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
            />
            {errs.start_date && <p className="text-xs text-red-400">{errs.start_date}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>End Date *</label>
            <input type="date" value={form.end_date} min={form.start_date || today()} onChange={set('end_date')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={dateStyle(errs.end_date)}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = errs.end_date ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
            />
            {errs.end_date && <p className="text-xs text-red-400">{errs.end_date}</p>}
          </div>
        </div>

        {duration > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <span className="text-lg">🗓️</span>
            <p className="text-sm font-semibold" style={{ color: '#c4b5fd' }}>
              {duration} day{duration !== 1 ? 's' : ''} — {fmt(form.start_date)} to {fmt(form.end_date)}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Reason *</label>
          <textarea rows={4} value={form.reason_for_request} onChange={set('reason_for_request')}
            placeholder="Describe your reason for requesting leave…"
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: errs.reason_for_request ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = errs.reason_for_request ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
          />
          {errs.reason_for_request && <p className="text-xs text-red-400">{errs.reason_for_request}</p>}
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal = ({ req, currentUser, onClose, onSuccess, saving, saveError, setSaveError, review }) => {
  const [action,    setAction]    = useState('');
  const [reason,    setReason]    = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const duration = daysBetween(req.start_date, req.end_date);

  // Block self-approval: staff is a StringRelatedField → the user's __str__ (full_name or email)
  // We compare against user.full_name and user.email as fallbacks
  const isOwnRequest =
    req.staff === currentUser?.full_name ||
    req.staff === currentUser?.email ||
    req.staff === `${currentUser?.full_name}`;

  const handleSubmit = async () => {
    if (action === 'decline' && !reason.trim()) { setReasonErr('A decline reason is required'); return; }
    const result = await review(req.id, action, reason);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Review Leave Request"
      subtitle={`${req.staff} · ${fmt(req.start_date)} – ${fmt(req.end_date)}`}
      onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        {/* Self-approval block */}
        {isOwnRequest && (
          <div className="flex items-start gap-3 px-4 py-4 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span className="text-xl shrink-0">🚫</span>
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">Cannot Approve Own Request</p>
              <p className="text-xs text-red-300">
                You are the requester. A manager cannot approve their own leave request.
                Another administrator must review this.
              </p>
            </div>
          </div>
        )}

        {/* Request summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Staff Member', req.staff],
            ['Duration',     `${duration} day${duration !== 1 ? 's' : ''}`],
            ['Start Date',   fmt(req.start_date)],
            ['End Date',     fmt(req.end_date)],
          ].map(([l, v]) => (
            <div key={l} className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              <p className="text-sm font-semibold text-white">{v}</p>
            </div>
          ))}
        </div>

        {/* Reason */}
        <div className="px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Reason for Leave
          </p>
          <p className="text-sm text-white/80 leading-relaxed">{req.reason_for_request}</p>
        </div>

        {/* Current status if already reviewed */}
        {req.status !== 'pending' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: STATUS_META[req.status]?.bg, border: `1px solid ${STATUS_META[req.status]?.border}` }}>
            <span>{STATUS_META[req.status]?.icon}</span>
            <p className="text-sm font-semibold" style={{ color: STATUS_META[req.status]?.color }}>
              This request is already {STATUS_META[req.status]?.label.toLowerCase()}.
            </p>
          </div>
        )}

        {/* Decision — disabled if own request */}
        {!isOwnRequest && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Decision</p>
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
            </div>

            {action === 'decline' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Decline Reason *
                </label>
                <textarea rows={3} value={reason}
                  onChange={e => { setReason(e.target.value); setReasonErr(''); }}
                  placeholder="Explain why this leave request is being declined…"
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

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>
            {isOwnRequest ? 'Close' : 'Cancel'}
          </Button>
          {!isOwnRequest && (
            <Button variant="primary" size="md" fullWidth loading={saving}
              disabled={!action || saving} onClick={handleSubmit}>
              {saving ? 'Submitting…' : 'Submit Decision'}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Leave Request row ────────────────────────────────────────────────────────

const LeaveRow = ({ req, currentUser, onReview, isOwnRequest }) => {
  const meta     = STATUS_META[req.status] ?? STATUS_META.pending;
  const duration = daysBetween(req.start_date, req.end_date);

  return (
    <div className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all"
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <div className="col-span-3">
        <p className="text-sm font-bold text-white truncate">{req.staff}</p>
        {isOwnRequest && (
          <p className="text-[10px] text-violet-400 font-semibold">Your request</p>
        )}
      </div>
      <div className="col-span-2">
        <p className="text-xs text-white/60">{fmt(req.start_date)}</p>
        <p className="text-xs text-white/40">{fmt(req.end_date)}</p>
      </div>
      <div className="col-span-1 text-center">
        <p className="text-xs font-bold text-white/70">{duration}d</p>
      </div>
      <div className="col-span-4">
        <p className="text-xs text-white/55 truncate">{req.reason_for_request}</p>
      </div>
      <div className="col-span-1">
        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
          {meta.label}
        </span>
      </div>
      <div className="col-span-1 flex justify-end">
        <button onClick={() => onReview(req)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={isOwnRequest ? {
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'not-allowed',
          } : req.status === 'pending' ? {
            background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(168,85,247,0.2))',
            color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)',
          } : {
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)',
          }}
          title={isOwnRequest ? 'You cannot review your own request' : req.status === 'pending' ? 'Review request' : 'View details'}>
          {isOwnRequest ? '🔒' : req.status === 'pending' ? 'Review' : 'View'}
        </button>
      </div>
    </div>
  );
};

// ─── Main manager Leave page ──────────────────────────────────────────────────

const TABS = [
  { id: 'all',    label: 'All Requests', icon: '📋', desc: 'Review and manage all leave requests' },
  { id: 'mine',   label: 'My Requests',  icon: '🏖️', desc: 'Your own leave request history'       },
];

const ManagerLeave = () => {
  const [activeTab,    setActiveTab]    = useState('all');
  const [showRequest,  setShowRequest]  = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');

  const { user } = useAuth();
  const { requests, loading, error, saving, saveError, setSaveError, create, review, refetch } = useAllLeave();

  // Separate own requests vs others
  const ownRequests = useMemo(() =>
    requests.filter(r =>
      r.staff === user?.full_name ||
      r.staff === user?.email
    ),
    [requests, user]
  );

  const isOwnRequest = (req) =>
    req.staff === user?.full_name || req.staff === user?.email;

  // All requests filtered for the review tab
  const filteredAll = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(r =>
      (statusFilter === 'all' || r.status === statusFilter) &&
      (!q || r.staff?.toLowerCase().includes(q) || r.reason_for_request?.toLowerCase().includes(q))
    );
  }, [requests, statusFilter, search]);

  const counts = useMemo(() => ({
    pending:  requests.filter(r => r.status === 'pending' && !isOwnRequest(r)).length,
    approved: requests.filter(r => r.status === 'approved').length,
    declined: requests.filter(r => r.status === 'declined').length,
  }), [requests, user]);

  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Leave Requests" pageSubtitle="Review staff leave requests and manage your own">
      <div className="space-y-5 animate-slide-up">

        {/* Tab bar */}
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

        {/* Tab header + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{current.icon}</span>
            <div>
              <h2 className="text-base font-black text-white">{current.label}</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{current.desc}</p>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowRequest(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Request Leave
          </Button>
        </div>

        {/* ── All Requests Tab ── */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {/* Count cards — only for others' pending */}
            {!loading && requests.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pending Review', value: counts.pending,  meta: STATUS_META.pending,  filter: 'pending'  },
                  { label: 'Approved',       value: counts.approved, meta: STATUS_META.approved, filter: 'approved' },
                  { label: 'Declined',       value: counts.declined, meta: STATUS_META.declined, filter: 'declined' },
                ].map(s => (
                  <div key={s.label}
                    className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: statusFilter === s.filter ? `1px solid ${s.meta.border}` : '1px solid rgba(255,255,255,0.08)' }}
                    onClick={() => setStatusFilter(statusFilter === s.filter ? 'all' : s.filter)}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${s.meta.bg}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ background: `linear-gradient(90deg,${s.meta.color},${s.meta.color}60)` }} />
                    <div className="text-2xl font-black text-white">{s.value}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-1.5">
                      <span>{s.meta.icon}</span>
                      <span style={{ color: s.meta.color }}>{s.label}</span>
                      {s.label === 'Pending Review' && s.value > 0 && <span className="animate-pulse">⚠️</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search + filter */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search by staff name or reason…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  onFocus={e => { e.target.style.border='1px solid rgba(124,58,237,0.5)'; e.target.style.background='rgba(124,58,237,0.06)'; }}
                  onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
                />
                {search && <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'approved', 'declined'].map(f => {
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
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
              </div>
            )}

            {!loading && !error && filteredAll.length === 0 && (
              <div className="text-center py-12 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-3xl mb-3">🏖️</p>
                <p className="text-white/50 text-sm">
                  {requests.length === 0 ? 'No leave requests submitted yet.' : 'No requests match your filters.'}
                </p>
              </div>
            )}

            {!loading && filteredAll.length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Column headers */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
                  style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="col-span-3">Staff</div>
                  <div className="col-span-2">Dates</div>
                  <div className="col-span-1">Days</div>
                  <div className="col-span-4">Reason</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>
                {filteredAll.map((req, i) => (
                  <div key={req.id} style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <LeaveRow
                      req={req}
                      currentUser={user}
                      onReview={setReviewTarget}
                      isOwnRequest={isOwnRequest(req)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── My Requests Tab ── */}
        {activeTab === 'mine' && (
          <div className="space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
              </div>
            )}
            {!loading && ownRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-5xl">🏖️</span>
                <div>
                  <p className="text-base font-black text-white mb-2">No leave requests yet</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Your submitted leave requests will appear here.
                  </p>
                </div>
                <Button variant="primary" size="md" onClick={() => setShowRequest(true)}>Request Leave</Button>
              </div>
            )}
            {!loading && ownRequests.map(req => {
              const meta     = STATUS_META[req.status] ?? STATUS_META.pending;
              const duration = daysBetween(req.start_date, req.end_date);
              return (
                <div key={req.id} className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${meta.border}` }}>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white">
                          {fmt(req.start_date)} → {fmt(req.end_date)}
                        </p>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {duration} day{duration !== 1 ? 's' : ''} · {req.reason_for_request.slice(0, 60)}{req.reason_for_request.length > 60 ? '…' : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Submitted {fmt(req.created_at?.slice(0, 10))}
                      </p>
                      {req.status === 'pending' && (
                        <p className="text-[10px] mt-0.5 text-amber-400 font-semibold">Awaiting review</p>
                      )}
                    </div>
                  </div>
                  {req.status === 'declined' && req.decline_reason && (
                    <div className="px-5 pb-4">
                      <div className="px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1 text-red-400">Decline Reason</p>
                        <p className="text-xs text-red-300">{req.decline_reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request modal */}
      {showRequest && (
        <RequestModal
          onClose={() => { setShowRequest(false); setSaveError(null); }}
          onSuccess={() => { setShowRequest(false); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          create={create}
        />
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          req={reviewTarget} currentUser={user}
          onClose={() => { setReviewTarget(null); setSaveError(null); }}
          onSuccess={() => { setReviewTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          review={review}
        />
      )}
    </DashboardLayout>
  );
};

export default ManagerLeave;