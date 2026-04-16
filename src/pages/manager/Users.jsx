import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useUsers from '../../hooks/useUsers';
import { generatePassword, passwordStrength } from '../../utils/passwordGenerator';

// ─── helpers ────────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'caregiver',  label: 'Care Giver'  },
  { value: 'supervisor', label: 'Supervisor'  },
  { value: 'admin',      label: 'Admin'        },
];

const SEX_OPTIONS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
];

const ROLE_STYLES = {
  admin:      { bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa', border: 'rgba(124,58,237,0.3)'  },
  supervisor: { bg: 'rgba(6,182,212,0.15)',   color: '#22d3ee', border: 'rgba(6,182,212,0.3)'   },
  caregiver:  { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
};

const ROLE_LABELS = { admin: 'Admin', supervisor: 'Supervisor', caregiver: 'Care Giver' };

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const initials = (u) =>
  `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#0891b2,#06b6d4)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
];

const avatarGradient = (id) =>
  AVATAR_GRADIENTS[(id?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];

// ─── CreateUserModal ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '',
  phone_number: '', date_of_birth: '', role: '', sex: '', password: '',
};

const CreateUserModal = ({ onClose, onSuccess, creating, createError, setCreateError, createUser }) => {
  const [form, setForm]         = useState({ ...EMPTY_FORM, password: generatePassword() });
  const [fieldErrors, setFieldErrors] = useState({});
  const [copied, setCopied]     = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [created, setCreated]   = useState(null); // holds new user on success

  const strength = passwordStrength(form.password);

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setFieldErrors((p) => ({ ...p, [key]: undefined }));
    if (createError) setCreateError(null);
  };

  const regenerate = () => {
    setForm((p) => ({ ...p, password: generatePassword() }));
    setCopied(false);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(form.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim())   e.first_name    = 'Required';
    if (!form.last_name.trim())    e.last_name     = 'Required';
    if (!form.email.trim())        e.email         = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone_number.trim()) e.phone_number  = 'Required';
    if (!form.date_of_birth)       e.date_of_birth = 'Required';
    if (!form.role)                e.role          = 'Select a role';
    if (!form.sex)                 e.sex           = 'Select sex';
    if (!form.password)            e.password      = 'Required';
    return e;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    const result = await createUser({
      first_name:    form.first_name.trim(),
      last_name:     form.last_name.trim(),
      email:         form.email.trim().toLowerCase(),
      phone_number:  form.phone_number.trim(),
      date_of_birth: form.date_of_birth,
      role:          form.role,
      sex:           form.sex,
      password:      form.password,
    });

    if (result.success) setCreated({ ...result.data, _password: form.password });
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (created) {
    return (
      <ModalShell onClose={() => onSuccess(created)} title="User Created!">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            ✅
          </div>
          <h3 className="text-lg font-black text-white mb-1">
            {created.first_name} {created.last_name}
          </h3>
          <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{created.email}</p>

          {/* Password reveal box */}
          <div className="w-full rounded-2xl p-4 mb-6 text-left"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <span>🔑</span> Share this password with the user — it won't be shown again
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-sm font-mono font-bold text-white bg-black/20 rounded-xl px-3 py-2 select-all">
                {created._password}
              </code>
              <CopyButton text={created._password} />
            </div>
          </div>

          <Button variant="primary" size="md" fullWidth onClick={() => onSuccess(created)}>
            Done
          </Button>
        </div>
      </ModalShell>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <ModalShell onClose={onClose} title="Create New User">
      <div className="space-y-5">
        {/* API error */}
        {createError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{createError}</span>
          </div>
        )}

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <DarkInput label="First Name" placeholder="Jane" value={form.first_name}
            onChange={set('first_name')} error={fieldErrors.first_name} />
          <DarkInput label="Last Name" placeholder="Kamau" value={form.last_name}
            onChange={set('last_name')} error={fieldErrors.last_name} />
        </div>

        {/* Email */}
        <DarkInput label="Email Address" type="email" placeholder="jane.kamau@amazingbrothers.com"
          value={form.email} onChange={set('email')} error={fieldErrors.email} />

        {/* Phone + DOB */}
        <div className="grid grid-cols-2 gap-4">
          <DarkInput label="Phone Number" placeholder="254712345678" value={form.phone_number}
            onChange={set('phone_number')} error={fieldErrors.phone_number} />
          <DarkInput label="Date of Birth" type="date" value={form.date_of_birth}
            onChange={set('date_of_birth')} error={fieldErrors.date_of_birth} />
        </div>

        {/* Role + Sex */}
        <div className="grid grid-cols-2 gap-4">
          <DarkSelect label="Role" value={form.role} onChange={set('role')}
            options={ROLES} placeholder="Select role" error={fieldErrors.role} />
          <DarkSelect label="Sex" value={form.sex} onChange={set('sex')}
            options={SEX_OPTIONS} placeholder="Select sex" error={fieldErrors.sex} />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Password
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                className="w-full text-sm rounded-xl px-4 py-3 pr-10 font-mono focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: fieldErrors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {showPwd
                  ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
            {/* Regenerate */}
            <button type="button" onClick={regenerate}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
              title="Generate new password">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* Copy */}
            <CopyButton text={form.password} />
          </div>

          {/* Strength bar */}
          <div className="space-y-1">
            <div className="h-1 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-1 rounded-full transition-all duration-300"
                style={{ width: strength.width, background: strength.color }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: strength.color }}>
              {strength.label} password
            </p>
          </div>

          {fieldErrors.password && (
            <p className="text-xs text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={creating} onClick={handleSubmit}>
            {creating ? 'Creating…' : 'Create User'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── UserDetailModal ─────────────────────────────────────────────────────────

const UserDetailModal = ({ user, onClose }) => {
  const style = ROLE_STYLES[user.role] ?? ROLE_STYLES.caregiver;
  return (
    <ModalShell onClose={onClose} title="User Details">
      <div className="space-y-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0"
            style={{ background: avatarGradient(user.id), boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
            {initials(user)}
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{user.first_name} {user.last_name}</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user.email}</p>
            <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Phone',          value: user.phone_number },
            { label: 'Date of Birth',  value: fmt(user.date_of_birth) },
            { label: 'Sex',            value: user.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : '—' },
            { label: 'Status',         value: user.is_active ? 'Active' : 'Inactive', highlight: user.is_active },
            { label: 'Member Since',   value: fmt(user.created_at) },
            { label: 'Last Login',     value: user.last_login ? fmt(user.last_login) : 'Never' },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: highlight === true ? '#34d399' : highlight === false ? '#f87171' : '#fff' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <Button variant="outline" size="md" fullWidth onClick={onClose}>Close</Button>
      </div>
    </ModalShell>
  );
};

// ─── Small shared sub-components ─────────────────────────────────────────────

const ModalShell = ({ children, title, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-slide-up"
      style={{ background: '#130d2e', border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-base font-black text-white">{title}</h2>
        <button onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Body — scrollable */}
      <div className="px-6 py-5 max-h-[80vh] overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {children}
      </div>
    </div>
  </div>
);

const DarkInput = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</label>
    <input
      className="w-full text-sm rounded-xl px-4 py-3 transition-all focus:outline-none"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
        color: '#fff',
        colorScheme: 'dark',
      }}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const DarkSelect = ({ label, value, onChange, options, placeholder, error }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full text-sm rounded-xl px-4 py-3 transition-all focus:outline-none appearance-none"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
        color: value ? '#fff' : 'rgba(255,255,255,0.35)',
        colorScheme: 'dark',
      }}
    >
      <option value="" disabled style={{ background: '#130d2e' }}>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: '#130d2e', color: '#fff' }}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button type="button" onClick={copy}
      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5"
      style={{
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
        border: copied ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.12)',
        color: copied ? '#34d399' : 'rgba(255,255,255,0.5)',
      }}
      title="Copy password">
      {copied
        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      }
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// ─── Main Users Page ─────────────────────────────────────────────────────────

const FILTER_OPTIONS = ['all', 'admin', 'supervisor', 'caregiver'];

const Users = () => {
  const { users, loading, error, creating, createError, setCreateError, createUser, refetch } = useUsers();
  const [showCreate, setShowCreate] = useState(false);
  const [viewUser, setViewUser]     = useState(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q)  ||
      u.email?.toLowerCase().includes(q)       ||
      u.phone_number?.includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreated = () => {
    setShowCreate(false);
    refetch();
  };

  return (
    <DashboardLayout pageTitle="Users" pageSubtitle="Manage staff accounts and roles">
      <div className="space-y-6 animate-slide-up">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <svg xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                }}
                onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>

            {/* Role filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_OPTIONS.map((f) => (
                <button key={f} onClick={() => setRoleFilter(f)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                  style={roleFilter === f ? {
                    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                  {f === 'all' ? 'All Roles' : ROLE_LABELS[f] ?? f}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" size="md" onClick={() => setShowCreate(true)}
            className="shrink-0 w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New User
          </Button>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Users',  value: users.length,                                              gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.3)' },
            { label: 'Admins',       value: users.filter(u => u.role === 'admin').length,              gradient: 'linear-gradient(90deg,#7c3aed,#6366f1)', glow: 'rgba(124,58,237,0.25)' },
            { label: 'Supervisors',  value: users.filter(u => u.role === 'supervisor').length,         gradient: 'linear-gradient(90deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.25)'  },
            { label: 'Care Givers',  value: users.filter(u => u.role === 'caregiver').length,          gradient: 'linear-gradient(90deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.25)' },
          ].map((s) => (
            <div key={s.label}
              className="relative rounded-2xl p-4 overflow-hidden transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${s.glow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.gradient }} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-xl animate-pulse"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
              <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading users…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl">⚠️</div>
              <p className="text-sm text-red-400">{error}</p>
              <Button variant="ghost" size="sm" onClick={refetch}>Retry</Button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-5xl">👤</div>
              <p className="text-sm font-semibold text-white">
                {search || roleFilter !== 'all' ? 'No users match your filters' : 'No users yet'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {!search && roleFilter === 'all' && 'Create the first user to get started'}
              </p>
            </div>
          )}

          {/* Rows */}
          {!loading && !error && filtered.map((user, idx) => {
            const style = ROLE_STYLES[user.role] ?? ROLE_STYLES.caregiver;
            return (
              <div key={user.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 cursor-pointer transition-all duration-150"
                style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => setViewUser(user)}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

                {/* Name + email */}
                <div className="sm:col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: avatarGradient(user.id) }}>
                    {initials(user)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="sm:col-span-3 flex items-center">
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {user.phone_number || '—'}
                  </span>
                </div>

                {/* Role badge */}
                <div className="sm:col-span-2 flex items-center">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>

                {/* Joined */}
                <div className="sm:col-span-2 flex items-center">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {fmt(user.created_at)}
                  </span>
                </div>

                {/* Status */}
                <div className="sm:col-span-1 flex items-center sm:justify-end">
                  <span className="w-2 h-2 rounded-full"
                    style={{
                      background: user.is_active ? '#10b981' : '#6b7280',
                      boxShadow: user.is_active ? '0 0 6px rgba(16,185,129,0.7)' : 'none',
                    }}
                    title={user.is_active ? 'Active' : 'Inactive'} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Count footer */}
        {!loading && !error && filtered.length > 0 && (
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateUserModal
          onClose={() => { setShowCreate(false); setCreateError(null); }}
          onSuccess={handleCreated}
          creating={creating}
          createError={createError}
          setCreateError={setCreateError}
          createUser={createUser}
        />
      )}
      {viewUser && (
        <UserDetailModal user={viewUser} onClose={() => setViewUser(null)} />
      )}
    </DashboardLayout>
  );
};

export default Users;