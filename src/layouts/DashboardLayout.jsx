import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

// ── Nav config by role ────────────────────────────────────────────────────────

const MANAGER_NAV = [
  {
    section: 'Overview',
    items: [
      { icon: '🏠', label: 'Dashboard', path: '/manager' },
    ],
  },
  {
    section: 'Setup & Administration',
    items: [
      { icon: '🏢', label: 'Facilities',  path: '/manager/facilities' },
      { icon: '🌿', label: 'Branches',    path: '/manager/branches'   },
      { icon: '👥', label: 'Users',       path: '/manager/users'      },
    ],
  },
  {
    section: 'Residents',
    items: [
      { icon: '🧑‍🦳', label: 'Residents',    path: '/manager/residents'    },
      { icon: '📋',   label: 'Assessments', path: '/manager/assessments'  },
      { icon: '📅',   label: 'Appointments', path: '/manager/appointments' },
    ],
  },
  {
    section: 'Care',
    items: [
      // Single entry — opens the tabbed Care hub (Categories / Items / Charts)
      { icon: '💊', label: 'Care',             path: '/manager/care'    },
      { icon: '❤️', label: 'Vitals',           path: '/manager/vitals'  },
      { icon: '🌙', label: 'Sleep Patterns',   path: '/manager/sleep'   },
      { icon: '📝', label: 'Resident Updates', path: '/manager/updates' },
    ],
  },
  {
    section: 'Requests & Reviews',
    items: [
      { icon: '🏖️', label: 'Leave Requests',   path: '/manager/leave'             },
      { icon: '🔧', label: 'Utilities & Repairs', path: '/manager/utilities'       },
      { icon: '🛒', label: 'Groceries',         path: '/manager/groceries'         },
      { icon: '⏰', label: 'Late Submissions',  path: '/manager/late-submissions'  },
    ],
  },
];

const CAREGIVER_NAV = [
  {
    section: 'Overview',
    items: [
      { icon: '🏠', label: 'Dashboard', path: '/caregiver' },
    ],
  },
  {
    section: 'Daily Charting',
    items: [
      // Single entry — opens the tabbed Care hub (Submit Chart / My Charts)
      { icon: '💊', label: 'Care Charts',     path: '/caregiver/care'  },
      { icon: '❤️', label: 'Vitals',          path: '/caregiver/vitals' },
      { icon: '🌙', label: 'Sleep Data',      path: '/caregiver/sleep'  },
    ],
  },
  {
    section: 'Resident Records',
    items: [
      { icon: '📝', label: 'Resident Updates', path: '/caregiver/updates'      },
      { icon: '📅', label: 'Appointments',     path: '/caregiver/appointments'  },
      { icon: '📋', label: 'Assessments',      path: '/caregiver/assessments'   },
    ],
  },
  {
    section: 'Requests',
    items: [
      { icon: '🏖️', label: 'Request Leave',     path: '/caregiver/leave'           },
      { icon: '⏰', label: 'Late Submission',   path: '/caregiver/late-submission'  },
      { icon: '🔧', label: 'Utilities & Repairs', path: '/caregiver/utilities'     },
      { icon: '🛒', label: 'Groceries',         path: '/caregiver/groceries'        },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar = ({ nav, user, onClose }) => {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase() ?? 'AB';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0825' }}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Logo size="sm" variant="light" />
        <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 shrink-0">
        <div className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 tracking-wide uppercase"
          style={{
            background: user?.role === 'admin' || user?.role === 'manager'
              ? 'rgba(124,58,237,0.18)' : 'rgba(16,185,129,0.15)',
            border: user?.role === 'admin' || user?.role === 'manager'
              ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(16,185,129,0.3)',
            color: user?.role === 'admin' || user?.role === 'manager' ? '#a78bfa' : '#34d399',
          }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: user?.role === 'admin' || user?.role === 'manager' ? '#a78bfa' : '#34d399' }} />
          {user?.role === 'admin' || user?.role === 'manager' ? 'Manager' : 'Care Giver'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {nav.map(group => (
          <div key={group.section}>
            <p className="px-3 mb-1.5 text-[10px] font-bold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/manager' || item.path === '/caregiver'}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
                  style={({ isActive }) => isActive ? {
                    background: 'linear-gradient(135deg,rgba(124,58,237,0.28),rgba(168,85,247,0.14))',
                    color: '#c4b5fd',
                    border: '1px solid rgba(124,58,237,0.32)',
                    boxShadow: '0 2px 12px rgba(124,58,237,0.12)',
                  } : {
                    color: 'rgba(255,255,255,0.42)',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!e.currentTarget.style.background.includes('124,58,237')) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.style.background.includes('124,58,237')) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.42)';
                    }
                  }}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 pb-5 pt-3 shrink-0 space-y-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 0 12px rgba(124,58,237,0.35)' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{user?.full_name ?? 'Staff'}</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.email ?? ''}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────

const Topbar = ({ title, subtitle, user, onMenuClick }) => {
  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase() ?? 'AB';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3.5"
      style={{ background: 'rgba(10,6,24,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-xl transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}
          onClick={onMenuClick}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="font-extrabold text-base md:text-lg text-white leading-tight">{title}</h1>
          {subtitle && <p className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.3)' }}>{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs pr-6">Search…</span>
        </div>
        <button className="relative p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"
            style={{ boxShadow: '0 0 6px rgba(239,68,68,0.7)' }} />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', boxShadow: '0 0 14px rgba(124,58,237,0.4)' }}>
          {initials}
        </div>
      </div>
    </header>
  );
};

// ── Layout shell ──────────────────────────────────────────────────────────────

const DashboardLayout = ({ children, pageTitle, pageSubtitle }) => {
  const { user }            = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const nav       = isManager ? MANAGER_NAV : CAREGIVER_NAV;

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0618' }}>
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <Sidebar nav={nav} user={user} onClose={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={pageTitle} subtitle={pageSubtitle} user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;