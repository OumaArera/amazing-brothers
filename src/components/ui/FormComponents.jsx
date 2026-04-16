/**
 * Shared dark-themed form primitives used across manager pages.
 * Import what you need: DarkInput, DarkSelect, ModalShell, ErrorBanner, UnsavedBadge
 */

// ─── DarkInput ───────────────────────────────────────────────────────────────
export const DarkInput = ({ label, error, hint, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {label}
      </label>
    )}
    <input
      className="w-full text-sm rounded-xl px-4 py-3 transition-all duration-200 focus:outline-none"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
        color: '#fff',
        colorScheme: 'dark',
      }}
      onFocus={e => {
        if (!error) e.target.style.border = '1px solid rgba(124,58,237,0.55)';
        e.target.style.background = 'rgba(124,58,237,0.07)';
      }}
      onBlur={e => {
        e.target.style.border = error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)';
        e.target.style.background = 'rgba(255,255,255,0.07)';
      }}
      {...props}
    />
    {hint && !error && (
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{hint}</p>
    )}
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

// ─── DarkSelect ──────────────────────────────────────────────────────────────
export const DarkSelect = ({ label, value, onChange, options, placeholder, error, hint }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {label}
      </label>
    )}
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
      onFocus={e => {
        if (!error) e.target.style.border = '1px solid rgba(124,58,237,0.55)';
        e.target.style.background = 'rgba(124,58,237,0.07)';
      }}
      onBlur={e => {
        e.target.style.border = error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)';
        e.target.style.background = 'rgba(255,255,255,0.07)';
      }}
    >
      {placeholder && (
        <option value="" disabled style={{ background: '#130d2e', color: 'rgba(255,255,255,0.4)' }}>
          {placeholder}
        </option>
      )}
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: '#130d2e', color: '#fff' }}>
          {o.label}
        </option>
      ))}
    </select>
    {hint && !error && (
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{hint}</p>
    )}
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

// ─── ModalShell ───────────────────────────────────────────────────────────────
export const ModalShell = ({ children, title, subtitle, onClose, maxWidth = 'max-w-md' }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div
      className={`w-full ${maxWidth} rounded-2xl overflow-hidden animate-slide-up`}
      style={{
        background: '#130d2e',
        border: '1px solid rgba(124,58,237,0.25)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div>
          <h2 className="text-base font-black text-white">{title}</h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all mt-0.5 shrink-0"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div
        className="px-6 py-5 max-h-[80vh] overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {children}
      </div>
    </div>
  </div>
);

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export const ErrorBanner = ({ message }) =>
  message ? (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
    >
      <span className="shrink-0 mt-0.5">⚠️</span>
      <span>{message}</span>
    </div>
  ) : null;

// ─── UnsavedBadge ────────────────────────────────────────────────────────────
export const UnsavedBadge = ({ visible }) =>
  visible ? (
    <p className="text-xs flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
      You have unsaved changes
    </p>
  ) : null;