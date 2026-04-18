import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { ModalShell, ErrorBanner, DarkSelect } from '../../components/ui/FormComponents';
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

// Status workflow: what actions are available at each status
const WORKFLOW = {
  reported:     [{ id: 'acknowledge', label: '👁 Acknowledge',    next: 'acknowledged' }],
  acknowledged: [{ id: 'start',      label: '🔨 Start Work',     next: 'in_progress'  },
                 { id: 'reject',     label: '❌ Reject',          next: 'rejected'     }],
  in_progress:  [{ id: 'resolve',    label: '✅ Mark Resolved',   next: 'resolved'     },
                 { id: 'reject',     label: '❌ Reject',          next: 'rejected'     }],
  resolved:     [{ id: 'close',      label: '🔒 Close',           next: 'closed'       }],
  closed:       [],
  rejected:     [],
};

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDT = iso =>
  iso ? new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const Pill = ({ meta }) => (
  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
    {meta.label}
  </span>
);

// ─── Action Modal ─────────────────────────────────────────────────────────────

const ActionModal = ({ req, onClose, onSuccess, saving, saveError, setSaveError, action }) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [notes,          setNotes]          = useState('');
  const [notesErr,       setNotesErr]       = useState('');

  const availableActions = WORKFLOW[req.status] ?? [];
  const needsNotes = selectedAction === 'resolve';
  const needsReason = selectedAction === 'reject';

  const handleSubmit = async () => {
    if ((needsNotes || needsReason) && !notes.trim()) {
      setNotesErr(needsNotes ? 'Resolution notes are required' : 'Rejection reason is required');
      return;
    }
    const extra = {};
    if (needsNotes)  extra.resolution_notes = notes.trim();
    if (needsReason) extra.rejection_reason = notes.trim();
    const result = await action(req.id, selectedAction, extra);
    if (result.success) onSuccess();
  };

  const statusMeta   = STATUS_META[req.status]   ?? STATUS_META.reported;
  const priorityMeta = PRIORITY_META[req.priority] ?? PRIORITY_META.medium;

  return (
    <ModalShell title="Manage Request" subtitle={req.title} onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Status',      <Pill meta={statusMeta} />],
            ['Priority',    <Pill meta={priorityMeta} />],
            ['Reported By', req.reported_by ?? '—'],
            ['Date',        fmt(req.created_at?.slice(0, 10))],
          ].map(([l, v]) => (
            <div key={l} className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              {typeof v === 'string' ? <p className="text-sm font-semibold text-white">{v}</p> : v}
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Description</p>
          <p className="text-sm text-white/75 leading-relaxed">{req.description}</p>
        </div>

        {/* Existing resolution / rejection */}
        {req.resolution_notes && (
          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1 text-emerald-400">Resolution Notes</p>
            <p className="text-sm text-emerald-300">{req.resolution_notes}</p>
          </div>
        )}
        {req.rejection_reason && (
          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1 text-red-400">Rejection Reason</p>
            <p className="text-sm text-red-300">{req.rejection_reason}</p>
          </div>
        )}

        {/* Actions — only if workflow allows */}
        {availableActions.length > 0 && (
          <>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.35)' }}>Update Status</p>
              <div className="flex flex-col gap-2">
                {availableActions.map(a => {
                  const nextMeta = STATUS_META[a.next];
                  return (
                    <button key={a.id}
                      onClick={() => { setSelectedAction(a.id); setNotes(''); setNotesErr(''); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left"
                      style={selectedAction === a.id ? {
                        background: nextMeta?.bg ?? 'rgba(124,58,237,0.2)',
                        border: `1px solid ${nextMeta?.border ?? 'rgba(124,58,237,0.4)'}`,
                        color: nextMeta?.color ?? '#c4b5fd',
                        boxShadow: `0 4px 16px ${nextMeta?.bg ?? 'rgba(124,58,237,0.1)'}`,
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.65)',
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

            {/* Notes / reason field */}
            {(needsNotes || needsReason) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {needsNotes ? 'Resolution Notes *' : 'Rejection Reason *'}
                </label>
                <textarea rows={3} value={notes}
                  onChange={e => { setNotes(e.target.value); setNotesErr(''); }}
                  placeholder={needsNotes ? 'Describe what was done to resolve this…' : 'Explain why this request is being rejected…'}
                  className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: notesErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
                  onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
                  onBlur={e => { e.target.style.border = notesErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
                />
                {notesErr && <p className="text-xs text-red-400">{notesErr}</p>}
              </div>
            )}
          </>
        )}

        {availableActions.length === 0 && (
          <div className="px-4 py-3 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              This request is {STATUS_META[req.status]?.label.toLowerCase()} — no further actions available.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>
            {availableActions.length === 0 ? 'Close' : 'Cancel'}
          </Button>
          {availableActions.length > 0 && (
            <Button variant="primary" size="md" fullWidth loading={saving}
              disabled={!selectedAction || saving} onClick={handleSubmit}>
              {saving ? 'Updating…' : 'Apply Action'}
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Utility row ──────────────────────────────────────────────────────────────

const UtilityRow = ({ req, branchMap, onManage, i }) => {
  const statusMeta   = STATUS_META[req.status]    ?? STATUS_META.reported;
  const priorityMeta = PRIORITY_META[req.priority] ?? PRIORITY_META.medium;
  const branchName   = branchMap[String(req.branch)] ?? '—';
  const isOpen       = ['reported', 'acknowledged', 'in_progress'].includes(req.status);

  return (
    <div className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-all"
      style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      <div className="col-span-4 min-w-0">
        <p className="text-sm font-bold text-white truncate">{req.title}</p>
        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {req.reported_by ?? '—'} · {branchName}
        </p>
      </div>
      <div className="col-span-2"><Pill meta={priorityMeta} /></div>
      <div className="col-span-2"><Pill meta={statusMeta} /></div>
      <div className="col-span-2">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{fmt(req.created_at?.slice(0, 10))}</p>
        {req.assigned_to && <p className="text-[10px] text-violet-400">{req.assigned_to}</p>}
      </div>
      <div className="col-span-2 flex justify-end">
        <Button variant={isOpen ? 'primary' : 'ghost'} size="sm" onClick={() => onManage(req)}>
          {isOpen ? 'Manage' : 'View'}
        </Button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ManagerUtilities = () => {
  const [manageTarget, setManageTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const { utilities, loading, error, saving, saveError, setSaveError, action, refetch } = useUtilities();
  const { branches } = useBranches();

  const branchMap = useMemo(() =>
    Object.fromEntries(branches.map(b => [String(b.id), b.name])),
    [branches]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return utilities.filter(u =>
      (statusFilter  === 'all' || u.status === statusFilter) &&
      (branchFilter  === ''    || String(u.branch) === branchFilter) &&
      (!q || u.title?.toLowerCase().includes(q) || u.reported_by?.toLowerCase().includes(q))
    );
  }, [utilities, statusFilter, branchFilter, search]);

  // Summary counts for open items
  const counts = useMemo(() => ({
    reported:     utilities.filter(u => u.status === 'reported').length,
    acknowledged: utilities.filter(u => u.status === 'acknowledged').length,
    in_progress:  utilities.filter(u => u.status === 'in_progress').length,
    resolved:     utilities.filter(u => u.status === 'resolved').length,
  }), [utilities]);

  const urgent = useMemo(() =>
    utilities.filter(u => u.priority === 'urgent' && ['reported','acknowledged','in_progress'].includes(u.status)),
    [utilities]
  );

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...branches.map(b => ({ value: String(b.id), label: b.name })),
  ];

  return (
    <DashboardLayout pageTitle="Utilities & Repairs" pageSubtitle="Track and manage all maintenance requests">
      <div className="space-y-5 animate-slide-up">

        {/* Urgent alert */}
        {urgent.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
              <span>🚨</span>
              <p className="text-sm font-bold text-red-400">
                {urgent.length} urgent issue{urgent.length !== 1 ? 's' : ''} need attention
              </p>
            </div>
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {urgent.map(u => (
                <button key={u.id}
                  onClick={() => setManageTarget(u)}
                  className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}>
                  🔧 {u.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline summary cards */}
        {!loading && utilities.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Reported',     value: counts.reported,     meta: STATUS_META.reported,     filter: 'reported'     },
              { label: 'Acknowledged', value: counts.acknowledged, meta: STATUS_META.acknowledged, filter: 'acknowledged' },
              { label: 'In Progress',  value: counts.in_progress,  meta: STATUS_META.in_progress,  filter: 'in_progress'  },
              { label: 'Resolved',     value: counts.resolved,     meta: STATUS_META.resolved,     filter: 'resolved'     },
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
          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by title or reporter…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              onFocus={e => { e.target.style.border='1px solid rgba(124,58,237,0.5)'; e.target.style.background='rgba(124,58,237,0.06)'; }}
              onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status pills */}
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
            {/* Branch dropdown */}
            <div className="ml-auto">
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
        {!loading && !error && utilities.length === 0 && (
          <div className="text-center py-14 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-3xl mb-3">🔧</p>
            <p className="text-white/50 text-sm">No utility requests submitted yet.</p>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && utilities.length > 0 && (
          <div className="text-center py-10 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/50 text-sm">No requests match your filters.</p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="col-span-4">Issue / Reporter</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            {filtered.map((req, i) => (
              <UtilityRow key={req.id} req={req} branchMap={branchMap} onManage={setManageTarget} i={i} />
            ))}
          </div>
        )}
      </div>

      {manageTarget && (
        <ActionModal
          req={manageTarget}
          onClose={() => { setManageTarget(null); setSaveError(null); }}
          onSuccess={() => { setManageTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          action={action}
        />
      )}
    </DashboardLayout>
  );
};

export default ManagerUtilities;