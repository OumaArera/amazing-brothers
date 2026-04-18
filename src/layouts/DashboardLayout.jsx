import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createData } from '../utils/api';
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


// ── Change Password Modal ─────────────────────────────────────────────────────

// Eye / Eye-off SVG icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

// Reusable password input with show/hide toggle
const PasswordInput = ({ placeholder, value, onChange, hasErr, onFocus, onBlur }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%', fontSize: 14, borderRadius: 12,
          padding: '10px 44px 10px 14px',
          outline: 'none', transition: 'all 0.2s',
          background: 'rgba(255,255,255,0.07)',
          border: hasErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
          color: '#fff', colorScheme: 'dark',
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: show ? '#a78bfa' : 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; }}
        onMouseLeave={e => { e.currentTarget.style.color = show ? '#a78bfa' : 'rgba(255,255,255,0.3)'; }}>
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [errs, setErrs] = useState({});
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiErr, setApiErr]   = useState('');

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrs(p => ({ ...p, [k]: undefined }));
    setApiErr('');
  };

  const validate = () => {
    const e = {};
    if (!form.old_password)               e.old_password = 'Enter your current password';
    if (!form.new_password)               e.new_password = 'Enter a new password';
    else if (form.new_password.length < 8) e.new_password = 'Password must be at least 8 characters';
    if (form.new_password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    const res = await createData('change-password/', {
      old_password: form.old_password,
      new_password: form.new_password,
    }, true);
    setSaving(false);
    if (res?.error) {
      setApiErr(typeof res.error === 'string' ? res.error : 'Failed to change password. Check your current password.');
      return;
    }
    setSuccess(true);
  };

  // Shared focus/blur handlers for border colour
  const focusBorder  = e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; e.target.style.background = 'rgba(124,58,237,0.07)'; };
  const blurBorder   = (hasErr) => e => { e.target.style.border = hasErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.07)'; };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#160d32 0%,#0d0820 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(168,85,247,0.2))', border: '1px solid rgba(124,58,237,0.35)' }}>
              🔐
            </div>
            <div>
              <h2 className="text-base font-black text-white">Change Password</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Keep your account secure</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {success ? (
            /* Success state */
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                ✅
              </div>
              <div>
                <p className="text-base font-black text-white mb-1">Password Changed</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Your password has been updated successfully.
                </p>
              </div>
              <button onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
                Done
              </button>
            </div>
          ) : (
            <>
              {/* API error */}
              {apiErr && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <p className="text-sm text-red-300">{apiErr}</p>
                </div>
              )}

              {/* Current password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Current Password *
                </label>
                <PasswordInput
                  placeholder="Enter your current password"
                  value={form.old_password}
                  onChange={set('old_password')}
                  hasErr={!!errs.old_password}
                  onFocus={focusBorder}
                  onBlur={blurBorder(errs.old_password)}
                />
                {errs.old_password && <p className="text-xs text-red-400">{errs.old_password}</p>}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>New Password</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  New Password *
                </label>
                <PasswordInput
                  placeholder="At least 8 characters"
                  value={form.new_password}
                  onChange={set('new_password')}
                  hasErr={!!errs.new_password}
                  onFocus={focusBorder}
                  onBlur={blurBorder(errs.new_password)}
                />
                {errs.new_password && <p className="text-xs text-red-400">{errs.new_password}</p>}

                {/* Strength indicator */}
                {form.new_password && (() => {
                  const len    = form.new_password.length;
                  const hasNum = /\d/.test(form.new_password);
                  const hasSym = /[^a-zA-Z0-9]/.test(form.new_password);
                  const score  = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0);
                  const label  = ['Too short', 'Weak', 'Fair', 'Strong', 'Very strong'][score] ?? 'Too short';
                  const color  = ['#f87171','#f87171','#fbbf24','#34d399','#34d399'][score] ?? '#f87171';
                  return (
                    <div className="space-y-1.5 mt-1">
                      <div className="flex gap-1">
                        {[0,1,2,3].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all"
                            style={{ background: i < score ? color : 'rgba(255,255,255,0.1)' }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold" style={{ color }}>{label}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Confirm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Confirm New Password *
                </label>
                <PasswordInput
                  placeholder="Repeat your new password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  hasErr={!!errs.confirm}
                  onFocus={focusBorder}
                  onBlur={blurBorder(errs.confirm)}
                />
                {errs.confirm && <p className="text-xs text-red-400">{errs.confirm}</p>}
                {!errs.confirm && form.confirm && form.new_password === form.confirm && (
                  <p className="text-xs font-semibold" style={{ color: '#34d399' }}>✓ Passwords match</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: saving ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color: '#fff', border: '1px solid rgba(124,58,237,0.5)',
                    boxShadow: saving ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}>
                  {saving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar = ({ nav, user, onClose, onChangePassword }) => {
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
        <button onClick={onChangePassword}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#c4b5fd' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </button>
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
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const nav       = isManager ? MANAGER_NAV : CAREGIVER_NAV;

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0618' }}>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <Sidebar nav={nav} user={user} onClose={() => setSidebarOpen(false)} onChangePassword={() => { setSidebarOpen(false); setShowChangePassword(true); }} />
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