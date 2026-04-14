import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Overview', id: 'overview' },
  { icon: '👥', label: 'Residents', id: 'residents' },
  { icon: '📋', label: 'Care Plans', id: 'care-plans' },
  { icon: '💊', label: 'Medications', id: 'medications' },
  { icon: '📝', label: 'Shift Notes', id: 'shift-notes' },
  { icon: '⚠️', label: 'Incidents', id: 'incidents' },
  { icon: '📅', label: 'Schedules', id: 'schedules' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

const RESIDENTS = [
  { name: 'Margaret W.', room: '1A', status: 'Stable', care: 'Memory Care', alert: false, initials: 'MW' },
  { name: 'Robert H.', room: '1B', status: 'Needs Attention', care: 'Personal Care', alert: true, initials: 'RH' },
  { name: 'Dorothy K.', room: '2A', status: 'Stable', care: 'Assisted Living', alert: false, initials: 'DK' },
  { name: 'Harold B.', room: '2B', status: 'Stable', care: 'Memory Care', alert: false, initials: 'HB' },
];

const INITIAL_TASKS = [
  { task: 'Morning medication round', time: '8:00 AM', done: true },
  { task: 'Robert H. — doctor follow-up call', time: '10:30 AM', done: false },
  { task: 'Lunch assistance & documentation', time: '12:00 PM', done: false },
  { task: 'Dorothy K. — physical therapy', time: '2:00 PM', done: false },
  { task: 'Evening medication round', time: '6:00 PM', done: false },
];

const STAT_CARDS = [
  {
    label: 'Residents', value: '4', sub: 'All checked in',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    glow: 'rgba(124,58,237,0.35)',
    icon: '👥',
  },
  {
    label: 'Tasks Due', value: '4', sub: 'Today\'s shift',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    glow: 'rgba(245,158,11,0.35)',
    icon: '✅',
  },
  {
    label: 'Needs Attention', value: '1', sub: 'Robert H.',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
    glow: 'rgba(239,68,68,0.35)',
    icon: '⚠️',
  },
  {
    label: 'Incidents', value: '0', sub: 'All clear today',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    glow: 'rgba(16,185,129,0.35)',
    icon: '📋',
  },
];

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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const toggleTask = (idx) =>
    setTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, done: !t.done } : t)));

  const initials = user?.full_name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase() ?? 'AB';

  const doneTasks = tasks.filter((t) => t.done).length;
  const progress = Math.round((doneTasks / tasks.length) * 100);

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0618', color: '#f1f0fe' }}>

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        style={{ background: 'rgba(15,10,46,0.95)', borderRight: '1px solid rgba(124,58,237,0.15)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Logo size="sm" variant="light" />
        </div>

        {/* Shift badge */}
        <div className="px-4 pt-4">
          <div className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            {getShift()} Shift Active
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto mt-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left"
              style={activeNav === item.id ? {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.15))',
                color: '#c4b5fd',
                border: '1px solid rgba(124,58,237,0.35)',
                boxShadow: '0 4px 16px rgba(124,58,237,0.15)',
              } : {
                color: 'rgba(255,255,255,0.4)',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => { if (activeNav !== item.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
              onMouseLeave={e => { if (activeNav !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; } }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User card */}
        <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.full_name ?? 'Staff'}</p>
              <p className="text-xs capitalize truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.role ?? 'Care Staff'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" fullWidth onClick={logout}>Sign Out</Button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(10,6,24,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden" style={{ color: 'rgba(255,255,255,0.5)' }} onClick={() => setSidebarOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="font-extrabold text-lg text-white capitalize">{activeNav.replace('-', ' ')}</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs">Quick search…</span>
            </div>
            {/* Bell */}
            <button className="relative p-2 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto space-y-6">

          {/* Welcome banner */}
          <div className="relative rounded-2xl p-6 md:p-8 overflow-hidden animate-slide-up"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.15) 50%, rgba(6,182,212,0.1) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#a78bfa' }}>
                  {getShift()} Shift
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-1">
                  Good {getTimeOfDay()}, {user?.full_name?.split(' ')[0] ?? 'there'} 👋
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="text-white font-semibold">{tasks.length - doneTasks} tasks</span> remaining · Robert H. needs attention
                </p>
              </div>
              {/* Progress ring-ish bar */}
              <div className="shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{progress}%</div>
                  <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Shift progress</div>
                  <div className="w-40 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map((card, i) => (
              <div key={card.label}
                className={`animate-slide-up-${i + 1} relative rounded-2xl p-5 overflow-hidden cursor-default transition-all duration-300`}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${card.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Gradient accent top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: card.gradient }} />
                <div className="text-2xl mb-3">{card.icon}</div>
                <div className="text-3xl font-black text-white mb-1">{card.value}</div>
                <div className="text-xs font-bold mb-0.5 text-white/80">{card.label}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-5 gap-6">

            {/* Residents — spans 3 cols */}
            <div className="lg:col-span-3 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-white">Residents</h3>
                <button className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">View all →</button>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {RESIDENTS.map((r) => (
                  <div key={r.name}
                    className="flex items-center justify-between px-6 py-4 transition-all duration-200 cursor-pointer"
                    style={{}}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                        {r.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                          {r.name}
                          {r.alert && <span className="w-2 h-2 rounded-full bg-rose-500" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Room {r.room} · {r.care}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold`}
                      style={r.status === 'Stable'
                        ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                        : { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks — spans 2 cols */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-white">Today's Tasks</h3>
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {doneTasks}/{tasks.length}
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="h-0.5 mx-6 mt-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-0.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }} />
              </div>
              <div className="divide-y mt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {tasks.map((task, idx) => (
                  <div
                    key={task.task}
                    className="flex items-center gap-3 px-6 py-3.5 cursor-pointer transition-all duration-200"
                    style={{ opacity: task.done ? 0.45 : 1 }}
                    onClick={() => toggleTask(idx)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={task.done
                        ? { background: 'linear-gradient(135deg, #7c3aed, #a855f7)', borderColor: 'transparent', boxShadow: '0 0 10px rgba(124,58,237,0.5)' }
                        : { borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}>
                      {task.done && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.done ? 'line-through' : 'text-white'}`}
                        style={{ color: task.done ? 'rgba(255,255,255,0.3)' : '#fff' }}>
                        {task.task}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{task.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;