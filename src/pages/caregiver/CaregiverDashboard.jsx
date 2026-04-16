import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import QuickActionCard from '../../components/ui/QuickActionCard';
import { useAuth } from '../../context/AuthContext';

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

const getShift = () => {
  const h = new Date().getHours();
  if (h < 14) return 'Morning';
  if (h < 22) return 'Afternoon';
  return 'Night';
};

// Dummy assigned residents
const MY_RESIDENTS = [
  { name: 'Margaret W.', room: '1A', care: 'Memory Care', initials: 'MW', charted: true, vitals: true },
  { name: 'Robert H.', room: '1B', care: 'Personal Care', initials: 'RH', charted: false, vitals: false, alert: true },
  { name: 'Dorothy K.', room: '2A', care: 'Assisted Living', initials: 'DK', charted: true, vitals: false },
];

// Today's task checklist
const INITIAL_TASKS = [
  { label: 'Morning care chart — Margaret W.', done: true, path: '/caregiver/care-charts' },
  { label: 'Record vitals — Robert H.', done: false, path: '/caregiver/vitals' },
  { label: 'Record vitals — Dorothy K.', done: false, path: '/caregiver/vitals' },
  { label: 'Care chart — Robert H.', done: false, path: '/caregiver/care-charts' },
  { label: 'Sleep log — Margaret W.', done: false, path: '/caregiver/sleep' },
];

const STATS = [
  { icon: '👥', label: 'My Residents', value: '3', sub: 'Assigned to you', gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.35)' },
  { icon: '✅', label: 'Tasks Done', value: '1', sub: 'Of 5 today', gradient: 'linear-gradient(90deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.35)' },
  { icon: '⚠️', label: 'Needs Attention', value: '1', sub: 'Robert H.', gradient: 'linear-gradient(90deg,#ef4444,#ec4899)', glow: 'rgba(239,68,68,0.35)' },
  { icon: '📝', label: 'Pending Charts', value: '2', sub: 'Submit today', gradient: 'linear-gradient(90deg,#f59e0b,#f97316)', glow: 'rgba(245,158,11,0.35)' },
];

const QUICK_ACTIONS = [
  { icon: '📊', label: 'Chart Care Data', desc: 'Submit daily care chart for your residents', path: '/caregiver/care-charts', accent: '#7c3aed', badge: '2 due' },
  { icon: '❤️', label: 'Record Vitals', desc: 'Chart blood pressure, temperature and more', path: '/caregiver/vitals', accent: '#ef4444', badge: '2 due' },
  { icon: '🌙', label: 'Sleep Log', desc: "Record residents' sleep patterns for tonight", path: '/caregiver/sleep', accent: '#6366f1' },
  { icon: '📝', label: 'Resident Updates', desc: 'Submit weekly and monthly resident updates', path: '/caregiver/updates', accent: '#0891b2' },
  { icon: '📅', label: 'Appointments', desc: 'Log and track upcoming resident appointments', path: '/caregiver/appointments', accent: '#10b981' },
  { icon: '📋', label: 'Assessments', desc: 'Complete resident assessment forms', path: '/caregiver/assessments', accent: '#06b6d4' },
  { icon: '🏖️', label: 'Request Leave', desc: 'Submit a leave request for approval', path: '/caregiver/leave', accent: '#f59e0b' },
  { icon: '⏰', label: 'Late Submission', desc: 'Request approval for a late submission', path: '/caregiver/late-submission', accent: '#f97316' },
  { icon: '🔧', label: 'Utilities & Repairs', desc: 'Report maintenance or repair needs', path: '/caregiver/utilities', accent: '#64748b' },
  { icon: '🛒', label: 'Groceries', desc: 'Submit a grocery request for the facility', path: '/caregiver/groceries', accent: '#84cc16' },
];

const CaregiverDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const toggleTask = (idx) =>
    setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, done: !t.done } : t)));

  const done = tasks.filter((t) => t.done).length;
  const progress = Math.round((done / tasks.length) * 100);
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <DashboardLayout pageTitle="Caregiver Dashboard" pageSubtitle={today}>
      <div className="space-y-8 animate-slide-up">

        {/* Welcome banner */}
        <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,182,212,0.12) 50%, rgba(124,58,237,0.1) 100%)',
            border: '1px solid rgba(16,185,129,0.22)',
          }}>
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#34d399' }}>
                {getShift()} Shift · Care Giver
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                Good {getTimeOfDay()}, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span className="text-amber-400 font-semibold">{tasks.length - done} tasks</span> remaining for your shift.
                {' '}Robert H. needs attention.
              </p>
            </div>
            {/* Shift progress */}
            <div className="shrink-0 text-center min-w-30">
              <div className="text-3xl font-black text-white">{progress}%</div>
              <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Shift progress</div>
              <div className="w-32 h-2 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#10b981,#06b6d4)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map((s, i) => <StatCard key={s.label} {...s} delay={i * 80} />)}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* My residents */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white text-sm">My Residents</h3>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{MY_RESIDENTS.length} assigned</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {MY_RESIDENTS.map((r) => (
                <div key={r.name}
                  className="px-5 py-4 transition-all duration-150 cursor-pointer"
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                      {r.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        {r.name}
                        {r.alert && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                          style={{ boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Rm {r.room} · {r.care}</p>
                    </div>
                  </div>
                  {/* Chart status pills */}
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={r.charted
                        ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                        : { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                      {r.charted ? '✓ Charted' : '✗ Chart due'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={r.vitals
                        ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                        : { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                      {r.vitals ? '✓ Vitals' : '✗ Vitals due'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's task checklist */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white text-sm">Today's Tasks</h3>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{done}/{tasks.length}</span>
            </div>
            {/* Progress bar */}
            <div className="mx-5 mt-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-1 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#10b981,#06b6d4)' }} />
            </div>
            <div className="divide-y mt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {tasks.map((task, idx) => (
                <div key={task.label}
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all duration-150"
                  style={{ opacity: task.done ? 0.45 : 1 }}
                  onClick={() => toggleTask(idx)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={task.done
                      ? { background: 'linear-gradient(135deg,#10b981,#06b6d4)', borderColor: 'transparent', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }
                      : { borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}>
                    {task.done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm font-medium flex-1"
                    style={{ color: task.done ? 'rgba(255,255,255,0.3)' : '#fff', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions — top 4 */}
          <div>
            <h3 className="font-bold text-white text-sm mb-3">Quick Actions</h3>
            <div className="space-y-3">
              {QUICK_ACTIONS.slice(0, 4).map((a) => (
                <QuickActionCard key={a.label} {...a} />
              ))}
            </div>
          </div>
        </div>

        {/* All features */}
        <div>
          <h3 className="font-bold text-white text-sm mb-4">All Features</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <QuickActionCard key={a.label} {...a} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CaregiverDashboard;