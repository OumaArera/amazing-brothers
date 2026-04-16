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

const STATS = [
  { icon: '🧑‍🦳', label: 'Residents', value: '12', sub: 'Across all branches', gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.35)' },
  { icon: '👤', label: 'Staff', value: '8', sub: '6 active today', gradient: 'linear-gradient(90deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.35)' },
  { icon: '⏳', label: 'Pending Reviews', value: '5', sub: 'Needs your attention', gradient: 'linear-gradient(90deg,#f59e0b,#f97316)', glow: 'rgba(245,158,11,0.35)' },
  { icon: '🏢', label: 'Facilities', value: '2', sub: '3 active branches', gradient: 'linear-gradient(90deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.35)' },
];

// Pending items needing review — simulated
const PENDING_REVIEWS = [
  { type: 'Care Chart', staff: 'Jane Mwangi', resident: 'Margaret W.', time: '2h ago', color: '#7c3aed' },
  { type: 'Vitals', staff: 'Peter Otieno', resident: 'Robert H.', time: '3h ago', color: '#0891b2' },
  { type: 'Leave Request', staff: 'Alice Kamau', resident: '—', time: '5h ago', color: '#f59e0b' },
  { type: 'Late Submission', staff: 'Brian Njoroge', resident: 'Dorothy K.', time: '6h ago', color: '#ef4444' },
  { type: 'Grocery Request', staff: 'Sarah Wanjiru', resident: '—', time: 'Yesterday', color: '#10b981' },
];

const QUICK_ACTIONS = [
  { icon: '🏢', label: 'Facilities', desc: 'Create and manage care facilities and branches', path: '/manager/facilities', accent: '#7c3aed' },
  { icon: '🧑‍🦳', label: 'Residents', desc: 'Add residents and manage their profiles', path: '/manager/residents', accent: '#0891b2' },
  { icon: '👥', label: 'Users', desc: 'Create staff accounts and manage roles', path: '/manager/users', accent: '#10b981' },
  { icon: '📊', label: 'Care Charts', desc: 'Review care charts submitted by caregivers', path: '/manager/care-charts', accent: '#f59e0b', badge: '3 new' },
  { icon: '❤️', label: 'Vitals', desc: 'Review daily vitals recorded by staff', path: '/manager/vitals', accent: '#ef4444', badge: '2 new' },
  { icon: '🗂️', label: 'Care Categories', desc: 'Manage care categories and items', path: '/manager/care-categories', accent: '#8b5cf6' },
  { icon: '📋', label: 'Assessments', desc: 'View and review resident assessments', path: '/manager/assessments', accent: '#06b6d4' },
  { icon: '🏖️', label: 'Leave Requests', desc: 'Review and approve staff leave requests', path: '/manager/leave', accent: '#f97316', badge: '1 pending' },
  { icon: '⏰', label: 'Late Submissions', desc: 'Waive submission timelines for staff', path: '/manager/late-submissions', accent: '#ec4899' },
  { icon: '🔧', label: 'Utilities & Repairs', desc: 'Review maintenance and repair requests', path: '/manager/utilities', accent: '#64748b' },
  { icon: '🛒', label: 'Groceries', desc: 'Review grocery requests from staff', path: '/manager/groceries', accent: '#84cc16' },
  { icon: '🌙', label: 'Sleep Patterns', desc: 'Review resident sleep data entries', path: '/manager/sleep', accent: '#6366f1' },
];

const ManagerDashboard = () => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <DashboardLayout pageTitle="Manager Dashboard" pageSubtitle={today}>
      <div className="space-y-8 animate-slide-up">

        {/* Welcome */}
        <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.22) 0%, rgba(236,72,153,0.13) 50%, rgba(6,182,212,0.09) 100%)',
            border: '1px solid rgba(124,58,237,0.22)',
          }}>
          <div className="absolute inset-0 opacity-[0.035]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#a78bfa' }}>
                Manager Portal
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                Good {getTimeOfDay()}, {user?.full_name?.split(' ')[0] ?? 'Manager'} 👋
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                You have <span className="text-amber-400 font-semibold">5 items</span> awaiting your review today.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="text-center px-5 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-2xl font-black text-white">12</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Residents</div>
              </div>
              <div className="text-center px-5 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-2xl font-black text-white">8</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Staff</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <StatCard key={s.label} {...s} delay={i * 80} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pending reviews */}
          <div className="lg:col-span-1 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="font-bold text-white text-sm">Pending Reviews</h3>
              <span className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.28)' }}>
                5 items
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {PENDING_REVIEWS.map((item) => (
                <div key={`${item.type}-${item.staff}`}
                  className="px-5 py-3.5 flex items-center gap-3 cursor-pointer transition-all duration-150"
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.type}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {item.staff}{item.resident !== '—' ? ` · ${item.resident}` : ''}
                    </p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.time}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                View all reviews →
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-white text-sm mb-4">Quick Access</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {QUICK_ACTIONS.slice(0, 6).map((a) => (
                <QuickActionCard key={a.label} {...a} />
              ))}
            </div>
          </div>
        </div>

        {/* All features grid */}
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

export default ManagerDashboard;