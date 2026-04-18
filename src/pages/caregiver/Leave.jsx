import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { DarkInput, ModalShell, ErrorBanner } from '../../components/ui/FormComponents';
import { useMyLeave } from '../../hooks/useLeave';

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

// ─── New Leave Request Modal ───────────────────────────────────────────────────

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

  const dateInputStyle = (hasErr) => ({
    background: 'rgba(255,255,255,0.07)',
    border: hasErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
    color: '#fff', colorScheme: 'dark',
  });

  return (
    <ModalShell title="Request Leave" subtitle="Submit a leave request for manager approval" onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Start Date *</label>
            <input type="date" value={form.start_date} min={today()}
              onChange={set('start_date')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={dateInputStyle(errs.start_date)}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = errs.start_date ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
            />
            {errs.start_date && <p className="text-xs text-red-400">{errs.start_date}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>End Date *</label>
            <input type="date" value={form.end_date} min={form.start_date || today()}
              onChange={set('end_date')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={dateInputStyle(errs.end_date)}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = errs.end_date ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
            />
            {errs.end_date && <p className="text-xs text-red-400">{errs.end_date}</p>}
          </div>
        </div>

        {/* Duration preview */}
        {duration > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <span className="text-lg">🗓️</span>
            <p className="text-sm font-semibold" style={{ color: '#c4b5fd' }}>
              {duration} day{duration !== 1 ? 's' : ''} — {fmt(form.start_date)} to {fmt(form.end_date)}
            </p>
          </div>
        )}

        {/* Reason */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Reason for Leave *
          </label>
          <textarea rows={4} value={form.reason_for_request} onChange={set('reason_for_request')}
            placeholder="Describe your reason for requesting leave (e.g. personal, medical, family)…"
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

// ─── Leave card ───────────────────────────────────────────────────────────────

const LeaveCard = ({ req }) => {
  const [expanded, setExpanded] = useState(false);
  const meta     = STATUS_META[req.status] ?? STATUS_META.pending;
  const duration = daysBetween(req.start_date, req.end_date);

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button type="button"
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

        {/* Status icon + date range */}
        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-xl"
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
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {duration} day{duration !== 1 ? 's' : ''} · Submitted {fmt(req.created_at?.slice(0, 10))}
          </p>
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              ['Start',    fmt(req.start_date)],
              ['End',      fmt(req.end_date)],
              ['Duration', `${duration} day${duration !== 1 ? 's' : ''}`],
            ].map(([l, v]) => (
              <div key={l} className="px-3 py-2.5 rounded-xl text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
                <p className="text-sm font-bold text-white">{v}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Reason</p>
            <p className="text-sm text-white/80 leading-relaxed">{req.reason_for_request}</p>
          </div>

          {req.status === 'declined' && req.decline_reason && (
            <div className="px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 text-red-400">Decline Reason</p>
              <p className="text-sm text-red-300 leading-relaxed">{req.decline_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CaregiverLeave = () => {
  const [showModal,    setShowModal]    = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { requests, loading, error, saving, saveError, setSaveError, create, refetch } = useMyLeave();

  const filtered = useMemo(() =>
    statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter),
    [requests, statusFilter]
  );

  const counts = useMemo(() => ({
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    declined: requests.filter(r => r.status === 'declined').length,
  }), [requests]);

  return (
    <DashboardLayout pageTitle="Leave Requests" pageSubtitle="Request and track your leave applications">
      <div className="space-y-5 animate-slide-up">

        {/* Header action */}
        <div className="flex items-center justify-between">
          <div />
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Request Leave
          </Button>
        </div>

        {/* Summary cards */}
        {requests.length > 0 && (
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
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.meta.bg}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${s.meta.color},${s.meta.color}60)` }} />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs mt-0.5 flex items-center gap-1.5">
                  <span className="text-base leading-none">{s.meta.icon}</span>
                  <span style={{ color: s.meta.color }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status filter pills */}
        {requests.length > 0 && (
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'declined'].map(f => {
              const meta = STATUS_META[f];
              return (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={statusFilter === f ? {
                    background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color: meta ? meta.color : '#fff',
                    border: `1px solid ${meta ? meta.border : 'transparent'}`,
                  } : {
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                  }}>
                  {f === 'all' ? 'All' : (meta?.label ?? f)}
                </button>
              );
            })}
          </div>
        )}

        {/* List */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
          </div>
        )}
        {!loading && error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}
        {!loading && !error && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-5xl">🏖️</span>
            <div>
              <p className="text-base font-black text-white mb-2">No leave requests yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Submit your first leave request and it will appear here.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>Request Leave</Button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && requests.length > 0 && (
          <div className="text-center py-10 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/50 text-sm">No {STATUS_META[statusFilter]?.label ?? ''} requests found.</p>
          </div>
        )}

        {!loading && filtered.map(req => (
          <LeaveCard key={req.id} req={req} />
        ))}
      </div>

      {showModal && (
        <RequestModal
          onClose={() => { setShowModal(false); setSaveError(null); }}
          onSuccess={() => { setShowModal(false); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          create={create}
        />
      )}
    </DashboardLayout>
  );
};

export default CaregiverLeave;