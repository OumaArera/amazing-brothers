const VARIANTS = {
  primary: {
    className: 'text-white font-bold active:scale-95',
    style: {
      background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
      boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
    },
    hoverStyle: { boxShadow: '0 6px 28px rgba(124,58,237,0.55)' },
  },
  ghost: {
    className: 'font-semibold border active:scale-95',
    style: {
      borderColor: 'rgba(124,58,237,0.4)',
      color: '#7c3aed',
      background: 'rgba(124,58,237,0.06)',
    },
  },
  danger: {
    className: 'text-white font-semibold active:scale-95',
    style: {
      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
    },
  },
  outline: {
    className: 'font-semibold border border-white/20 text-white/80 hover:text-white hover:bg-white/10 active:scale-95',
    style: {},
  },
};

const SIZES = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-2xl',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  style = {},
  ...props
}) => {
  const v = VARIANTS[variant];
  const base =
    'inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={`${base} ${v.className} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...v.style, ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;