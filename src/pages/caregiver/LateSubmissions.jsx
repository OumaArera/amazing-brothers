import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useLatePermissions } from '../../hooks/useLateSubmissions';
import Button from '../../components/ui/Button';

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
  if (h === 0) return `${m} minute${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`;
  return `${h}h ${m}m`;
};

const TYPE_META = {
  chart:      { label: 'Daily Chart',  icon: '📊', color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)' },
  vitals:     { label: 'Vitals',       icon: '❤️', color: '#f87171', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)'  },
  medication: { label: 'Medication',   icon: '💊', color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' },
};

// Live countdown hook
const useCountdown = (expiresAt) => {
  const [, forceUpdate] = useState(0);
  // Re-render every minute
  useMemo(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 60000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return { expired: true, label: 'Expired' };
  const totalMins = Math.ceil(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return { expired: false, label: h > 0 ? `${h}h ${m}m remaining` : `${m} min remaining` };
};

// ─── Single active permission card ───────────────────────────────────────────

const ActiveCard = ({ perm }) => {
  const countdown = useCountdown(perm.expires_at);
  const meta      = TYPE_META[perm.submission_type] ?? TYPE_META.chart;
  const totalSecs = perm.duration_seconds || 1;
  const elapsed   = Math.max(0, new Date() - new Date(perm.starts_at)) / 1000;
  const pct       = Math.min(100, Math.round((elapsed / totalSecs) * 100));

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${meta.border}`, background: meta.bg }}>
      {/* Top accent bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg,${meta.color},${meta.color}60)` }} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(255,255,255,0.1)', border: `1px solid ${meta.border}` }}>
              {meta.icon}
            </div>
            <div>
              <p className="text-base font-black text-white">{meta.label}</p>
              <p className="text-xs mt-0.5" style={{ color: meta.color }}>Late submission permitted</p>
            </div>
          </div>
          {/* Countdown badge */}
          <div className="px-3 py-1.5 rounded-xl shrink-0"
            style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${meta.border}` }}>
            <p className="text-xs font-black" style={{ color: countdown?.expired ? '#f87171' : '#fbbf24' }}>
              ⏱ {countdown?.label ?? '—'}
            </p>
          </div>
        </div>

        {/* Time window */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Opens',    fmtDT(perm.starts_at)],
            ['Closes',   fmtDT(perm.expires_at)],
            ['Duration', fmtDuration(perm.duration_seconds)],
            ['Status',   countdown?.expired ? '❌ Expired' : '🟢 Active'],
          ].map(([l, v]) => (
            <div key={l} className="px-3 py-2 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</p>
              <p className="text-xs font-bold text-white">{v}</p>
            </div>
          ))}
        </div>

        {/* Elapsed progress bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>Time elapsed</span>
            <span>{pct}% used</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct > 80 ? '#f87171' : pct > 50 ? '#fbbf24' : meta.color,
              }} />
          </div>
        </div>

        {/* Reason (if provided) */}
        {perm.reason && (
          <div className="px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Manager Note</p>
            <p className="text-xs text-white/70 leading-relaxed">{perm.reason}</p>
          </div>
        )}

        {/* Action instruction */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="text-sm">💡</span>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            You can now submit past-due <strong className="text-white">{meta.label}</strong> entries while this window is active.
            Go to the relevant section and submit as normal.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CaregiverLateSubmission = () => {
  const { permissions, activePermissions, loading, error, refetch } = useLatePermissions();

  // Group by type for display
  const byType = useMemo(() => {
    const map = {};
    activePermissions.forEach(p => {
      if (!map[p.submission_type]) map[p.submission_type] = [];
      map[p.submission_type].push(p);
    });
    return map;
  }, [activePermissions]);

  const hasAny = activePermissions.length > 0;

  return (
    <DashboardLayout pageTitle="Late Submission" pageSubtitle="Active late submission permissions for your branch">
      <div className="space-y-5 animate-slide-up">

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Checking permissions…</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-red-400 text-sm">{error}</p>
            <Button variant="ghost" size="sm" onClick={refetch} className="mt-3">Retry</Button>
          </div>
        )}

        {!loading && !error && !hasAny && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.25)' }}>
              🔒
            </div>
            <div>
              <p className="text-base font-black text-white mb-2">No Active Permissions</p>
              <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Your branch currently has no late submission windows open. Contact your manager if you need to submit a past-due entry.
              </p>
            </div>
            {/* Show history count */}
            {permissions.length > 0 && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {permissions.length} past permission{permissions.length !== 1 ? 's' : ''} on record
              </p>
            )}
          </div>
        )}

        {!loading && !error && hasAny && (
          <div className="space-y-4">
            {/* Active permissions by type */}
            {Object.entries(byType).map(([type, perms]) => (
              <div key={type} className="space-y-3">
                {perms.map(p => <ActiveCard key={p.id} perm={p} />)}
              </div>
            ))}

            {/* Refresh hint */}
            <div className="text-center pt-2">
              <button onClick={refetch}
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}>
                ↻ Refresh permissions
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default CaregiverLateSubmission;