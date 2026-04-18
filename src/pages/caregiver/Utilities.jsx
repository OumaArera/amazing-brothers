import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { DarkInput, DarkSelect, ModalShell, ErrorBanner } from '../../components/ui/FormComponents';
import useUtilities from '../../hooks/useUtilities';
import useBranches from '../../hooks/useBranches';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  reported:     { label: 'Reported',     color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)', icon: '📋' },
  acknowledged: { label: 'Acknowledged', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  icon: '👁'  },
  in_progress:  { label: 'In Progress',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  icon: '🔨' },
  resolved:     { label: 'Resolved',     color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  icon: '✅' },
  closed:       { label: 'Closed',       color: '#a78bfa', bg: 'rgba(124,58,237,0.15)',  border: 'rgba(124,58,237,0.3)',  icon: '🔒' },
  rejected:     { label: 'Rejected',     color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   icon: '❌' },
};

const PRIORITY_META = {
  low:    { label: 'Low',    color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' },
  medium: { label: 'Medium', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)'  },
  high:   { label: 'High',   color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  urgent: { label: 'Urgent', color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'   },
};

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const Pill = ({ meta }) => (
  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
    {meta.label}
  </span>
);

// ─── Create Request Modal ─────────────────────────────────────────────────────

const CreateModal = ({ branches, onClose, onSuccess, saving, saveError, setSaveError, create }) => {
  const [form, setForm] = useState({ branch_id: '', title: '', description: '', priority: 'medium' });
  const [errs, setErrs] = useState({});

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrs(p => ({ ...p, [k]: undefined }));
    if (saveError) setSaveError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.branch_id)        e.branch_id    = 'Select a branch';
    if (!form.title.trim())     e.title        = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const result = await create({ ...form, title: form.title.trim(), description: form.description.trim() });
    if (result.success) onSuccess();
  };

  const branchOptions  = branches.map(b => ({ value: String(b.id), label: b.name }));
  const priorityOptions = Object.entries(PRIORITY_META).map(([k, v]) => ({ value: k, label: v.label }));

  return (
    <ModalShell title="Report Utility / Repair" subtitle="Log a maintenance or repair issue for your branch" onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        <div className="grid grid-cols-2 gap-3">
          <DarkSelect label="Branch *" value={form.branch_id} onChange={set('branch_id')}
            options={branchOptions} placeholder="Select branch…" error={errs.branch_id} />
          <DarkSelect label="Priority" value={form.priority} onChange={set('priority')}
            options={priorityOptions} />
        </div>

        <DarkInput label="Title *" placeholder="e.g. Broken bathroom faucet"
          value={form.title} onChange={set('title')} error={errs.title} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Description *</label>
          <textarea rows={4} value={form.description} onChange={set('description')}
            placeholder="Describe the issue in detail — location, severity, what happened…"
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: errs.description ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = errs.description ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
          />
          {errs.description && <p className="text-xs text-red-400">{errs.description}</p>}
        </div>

        {/* Priority legend */}
        <div className="flex gap-2 flex-wrap px-1">
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <span key={k} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>
              {v.label}
            </span>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Submitting…' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Request card ─────────────────────────────────────────────────────────────

const RequestCard = ({ req }) => {
  const [expanded, setExpanded] = useState(false);
  const statusMeta   = STATUS_META[req.status]   ?? STATUS_META.reported;
  const priorityMeta = PRIORITY_META[req.priority] ?? PRIORITY_META.medium;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button type="button"
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

        {/* Status icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: statusMeta.bg, border: `1px solid ${statusMeta.border}` }}>
          {statusMeta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{req.title}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Pill meta={statusMeta} />
            <Pill meta={priorityMeta} />
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{fmt(req.created_at?.slice(0, 10))}</p>
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform"
          style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {[
              ['Reported By',  req.reported_by ?? '—'],
              ['Assigned To',  req.assigned_to ?? 'Unassigned'],
              ['Submitted',    fmt(req.created_at?.slice(0, 10))],
            ].map(([l, v]) => (
              <div key={l} className="px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
                <p className="text-xs font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Description</p>
            <p className="text-sm text-white/75 leading-relaxed">{req.description}</p>
          </div>

          {req.resolution_notes && (
            <div className="px-4 py-3 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 text-emerald-400">Resolution Notes</p>
              <p className="text-sm text-emerald-300 leading-relaxed">{req.resolution_notes}</p>
            </div>
          )}

          {req.rejection_reason && (
            <div className="px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 text-red-400">Rejection Reason</p>
              <p className="text-sm text-red-300 leading-relaxed">{req.rejection_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CaregiverUtilities = () => {
  const [showModal,    setShowModal]    = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { utilities, loading, error, saving, saveError, setSaveError, create, refetch } = useUtilities();
  const { branches } = useBranches();

  const filtered = useMemo(() =>
    statusFilter === 'all' ? utilities : utilities.filter(u => u.status === statusFilter),
    [utilities, statusFilter]
  );

  const pendingCount = utilities.filter(u =>
    ['reported', 'acknowledged', 'in_progress'].includes(u.status)
  ).length;

  return (
    <DashboardLayout pageTitle="Utilities & Repairs" pageSubtitle="Report and track maintenance issues">
      <div className="space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {pendingCount > 0 && (
              <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                {pendingCount} open issue{pendingCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Report Issue
          </Button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.keys(STATUS_META)].map(f => {
            const meta = STATUS_META[f];
            return (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={statusFilter === f ? {
                  background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: meta ? meta.color : '#fff',
                  border: `1px solid ${meta ? meta.border : 'transparent'}`,
                } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                {f === 'all' ? 'All' : meta.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
          </div>
        )}
        {!loading && error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}
        {!loading && !error && utilities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-5xl">🔧</span>
            <div>
              <p className="text-base font-black text-white mb-2">No reports yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Report any maintenance or repair issues here.</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>Report Issue</Button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && utilities.length > 0 && (
          <div className="text-center py-10 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/50 text-sm">No {STATUS_META[statusFilter]?.label ?? ''} requests found.</p>
          </div>
        )}

        {!loading && filtered.map(req => <RequestCard key={req.id} req={req} />)}
      </div>

      {showModal && (
        <CreateModal
          branches={branches}
          onClose={() => { setShowModal(false); setSaveError(null); }}
          onSuccess={() => { setShowModal(false); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          create={create}
        />
      )}
    </DashboardLayout>
  );
};

export default CaregiverUtilities;