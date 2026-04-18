import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import {
  DarkInput, DarkSelect, ModalShell, ErrorBanner,
} from '../../components/ui/FormComponents';
import { useLatePermissions } from '../../hooks/useLateSubmissions';
import useBranches from '../../hooks/useBranches';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDT = iso =>
  iso ? new Date(iso).toLocaleString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const fmtDuration = (seconds) => {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Convert human input to seconds
const toSeconds = (value, unit) => {
  const n = Number(value);
  if (!n || n <= 0) return 0;
  if (unit === 'minutes') return n * 60;
  if (unit === 'hours')   return n * 3600;
  if (unit === 'days')    return n * 86400;
  return 0;
};

const TYPE_META = {
  chart:      { label: 'Daily Chart',  icon: '📊', color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)' },
  vitals:     { label: 'Vitals',       icon: '❤️', color: '#f87171', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)'  },
  medication: { label: 'Medication',   icon: '💊', color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
};

const StatusBadge = ({ isActive }) => (
  <span className="text-xs px-2.5 py-1 rounded-full font-bold"
    style={isActive ? {
      background: 'rgba(16,185,129,0.18)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)',
    } : {
      background: 'rgba(100,116,139,0.18)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)',
    }}>
    {isActive ? '🟢 Active' : '⚫ Expired'}
  </span>
);

// Countdown display
const Countdown = ({ expiresAt }) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return <span className="text-xs text-white/30">Expired</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return (
    <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>
      Expires in {h > 0 ? `${h}h ` : ''}{m}m
    </span>
  );
};

// ─── Grant Permission Modal ───────────────────────────────────────────────────

const GrantModal = ({ branches, onClose, onSuccess, saving, saveError, setSaveError, create }) => {
  const [form, setForm] = useState({
    branch:          '',
    submission_type: '',
    starts_at:       '',   // datetime-local value
    duration_value:  '',
    duration_unit:   'hours',
    reason:          '',
  });
  const [errs, setErrs] = useState({});

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrs(p => ({ ...p, [k]: undefined }));
    if (saveError) setSaveError(null);
  };

  // Preview expiry
  const previewExpiry = useMemo(() => {
    if (!form.starts_at || !form.duration_value) return null;
    const secs = toSeconds(form.duration_value, form.duration_unit);
    if (!secs) return null;
    const start = new Date(form.starts_at);
    return new Date(start.getTime() + secs * 1000);
  }, [form.starts_at, form.duration_value, form.duration_unit]);

  const validate = () => {
    const e = {};
    if (!form.branch)          e.branch          = 'Select a branch';
    if (!form.submission_type) e.submission_type  = 'Select a type';
    if (!form.starts_at)       e.starts_at        = 'Set a start time';
    if (!form.duration_value || Number(form.duration_value) <= 0)
      e.duration_value = 'Enter a valid duration';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const secs = toSeconds(form.duration_value, form.duration_unit);
    // Convert datetime-local to ISO string
    const startsAtISO = new Date(form.starts_at).toISOString();
    const result = await create({
      branch:           form.branch,
      submission_type:  form.submission_type,
      starts_at:        startsAtISO,
      duration_seconds: secs,
      reason:           form.reason.trim(),
    });
    if (result.success) onSuccess();
  };

  const branchOptions = branches.map(b => ({ value: String(b.id), label: b.name }));
  const typeOptions   = Object.entries(TYPE_META).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }));
  const unitOptions   = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours',   label: 'Hours'   },
    { value: 'days',    label: 'Days'    },
  ];

  return (
    <ModalShell title="Grant Late Submission Permission"
      subtitle="Allow a branch to submit entries past their deadline"
      onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        <div className="grid grid-cols-2 gap-3">
          <DarkSelect label="Branch *" value={form.branch} onChange={set('branch')}
            options={branchOptions} placeholder="Select branch…" error={errs.branch} />
          <DarkSelect label="Submission Type *" value={form.submission_type} onChange={set('submission_type')}
            options={typeOptions} placeholder="Select type…" error={errs.submission_type} />
        </div>

        {/* Start time */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Permission Starts At *
          </label>
          <input type="datetime-local" value={form.starts_at} onChange={set('starts_at')}
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: errs.starts_at ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = errs.starts_at ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
          />
          {errs.starts_at && <p className="text-xs text-red-400">{errs.starts_at}</p>}
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Duration *
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <DarkInput type="number" min="1" step="1"
                placeholder="e.g. 2" value={form.duration_value}
                onChange={set('duration_value')} error={errs.duration_value} />
            </div>
            <div className="w-36">
              <DarkSelect label="" value={form.duration_unit} onChange={set('duration_unit')}
                options={unitOptions} />
            </div>
          </div>
        </div>

        {/* Expiry preview */}
        {previewExpiry && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <span>⏱️</span>
            <div>
              <p className="text-xs font-bold" style={{ color: '#c4b5fd' }}>Permission window</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {fmtDT(form.starts_at)} → {fmtDT(previewExpiry.toISOString())}
              </p>
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Reason <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea rows={3} value={form.reason} onChange={set('reason')}
            placeholder="Why is late submission being granted? (e.g. system outage, emergency)"
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Granting…' : 'Grant Permission'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Permission card ──────────────────────────────────────────────────────────

const PermissionCard = ({ perm, branches, onDelete, deleting }) => {
  const [expanded, setExpanded] = useState(false);
  const typeMeta = TYPE_META[perm.submission_type] ?? TYPE_META.chart;
  const branchName = branches.find(b => String(b.id) === String(perm.branch))?.name ?? `Branch ${perm.branch}`;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: perm.is_active ? '1px solid rgba(124,58,237,0.25)' : '1px solid rgba(255,255,255,0.07)',
      }}>
      {/* Active top stripe */}
      {perm.is_active && (
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
      )}

      <button type="button"
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

        {/* Type icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: typeMeta.bg, border: `1px solid ${typeMeta.border}` }}>
          {typeMeta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{typeMeta.label}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: typeMeta.bg, color: typeMeta.color, border: `1px solid ${typeMeta.border}` }}>
              {branchName}
            </span>
            <StatusBadge isActive={perm.is_active} />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {fmtDT(perm.starts_at)} · {fmtDuration(perm.duration_seconds)}
            </p>
            {perm.is_active && <Countdown expiresAt={perm.expires_at} />}
          </div>
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[
              ['Branch',    branchName],
              ['Type',      typeMeta.label],
              ['Starts',    fmtDT(perm.starts_at)],
              ['Expires',   fmtDT(perm.expires_at)],
            ].map(([l, v]) => (
              <div key={l} className="px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
                <p className="text-xs font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Duration</p>
              <p className="text-xs font-semibold text-white">{fmtDuration(perm.duration_seconds)}</p>
            </div>
            <div className="px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Granted By</p>
              <p className="text-xs font-semibold text-white">{perm.created_by ?? '—'}</p>
            </div>
          </div>

          {perm.reason && (
            <div className="px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Reason</p>
              <p className="text-sm text-white/75 leading-relaxed">{perm.reason}</p>
            </div>
          )}

          {/* Revoke button (only for active) */}
          {perm.is_active && (
            <div className="flex justify-end pt-1">
              <Button variant="danger" size="sm" loading={deleting} onClick={() => onDelete(perm.id)}>
                Revoke Permission
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ManagerLateSubmissions = () => {
  const [showModal,   setShowModal]   = useState(false);
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [activeOnly,  setActiveOnly]  = useState(false);
  const [deleting,    setDeleting]    = useState(null);

  const { branches } = useBranches();
  const {
    permissions, activePermissions,
    loading, error,
    saving, saveError, setSaveError,
    create, remove, refetch,
  } = useLatePermissions();

  const displayed = useMemo(() => {
    let src = activeOnly ? activePermissions : permissions;
    if (typeFilter !== 'all') src = src.filter(p => p.submission_type === typeFilter);
    return src;
  }, [permissions, activePermissions, typeFilter, activeOnly]);

  const handleDelete = async (id) => {
    setDeleting(id);
    await remove(id);
    setDeleting(null);
  };

  return (
    <DashboardLayout pageTitle="Late Submissions" pageSubtitle="Grant branches permission to submit entries past their deadline">
      <div className="space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl flex-1"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <span className="shrink-0">ℹ️</span>
            <p className="text-xs leading-relaxed" style={{ color: '#c4b5fd' }}>
              Grant a branch a time-limited window to submit past-due entries. Each permission has a start time, duration, and type (Daily Chart, Vitals, Medication). Caregivers see only active permissions for their branch.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)} className="shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Grant Permission
          </Button>
        </div>

        {/* Active count cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(TYPE_META).map(([key, meta]) => {
              const activeCount = activePermissions.filter(p => p.submission_type === key).length;
              return (
                <div key={key}
                  className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: typeFilter === key ? `1px solid ${meta.border}` : '1px solid rgba(255,255,255,0.08)',
                  }}
                  onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${meta.bg}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${meta.color},${meta.color}60)` }} />
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{meta.icon}</span>
                    <span className="text-xl font-black" style={{ color: activeCount > 0 ? meta.color : 'rgba(255,255,255,0.3)' }}>
                      {activeCount}
                    </span>
                  </div>
                  <p className="text-xs mt-1 font-semibold" style={{ color: meta.color }}>{meta.label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>active permission{activeCount !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {['all', 'chart', 'vitals', 'medication'].map(f => {
              const meta = TYPE_META[f];
              return (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={typeFilter === f ? {
                    background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color: meta ? meta.color : '#fff',
                    border: `1px solid ${meta ? meta.border : 'transparent'}`,
                  } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {f === 'all' ? 'All Types' : `${meta.icon} ${meta.label}`}
                </button>
              );
            })}
          </div>
          {/* Active toggle */}
          <button type="button"
            onClick={() => setActiveOnly(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ml-auto"
            style={activeOnly ? {
              background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)',
            } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeOnly ? '#34d399' : 'rgba(255,255,255,0.3)' }} />
            Active Only
          </button>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-5xl">⏰</span>
            <div>
              <p className="text-base font-black text-white mb-2">No permissions found</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {permissions.length === 0 ? 'Grant your first late submission permission.' : 'No permissions match your filters.'}
              </p>
            </div>
            {permissions.length === 0 && (
              <Button variant="primary" size="md" onClick={() => setShowModal(true)}>Grant Permission</Button>
            )}
          </div>
        )}

        {/* Permission list */}
        {!loading && displayed.map(perm => (
          <PermissionCard
            key={perm.id}
            perm={perm}
            branches={branches}
            onDelete={handleDelete}
            deleting={deleting === perm.id}
          />
        ))}
      </div>

      {showModal && (
        <GrantModal
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

export default ManagerLateSubmissions;