const Logo = ({ size = 'md', variant = 'dark', className = '' }) => {
  const sizes = {
    sm: { wrap: 'w-7 h-7 text-xs', text: 'text-sm', sub: 'text-[9px]' },
    md: { wrap: 'w-9 h-9 text-sm', text: 'text-base', sub: 'text-[10px]' },
    lg: { wrap: 'w-12 h-12 text-base', text: 'text-xl', sub: 'text-xs' },
  };
  const s = sizes[size];
  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.wrap} rounded-xl flex items-center justify-center font-black shrink-0`}
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
          boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
        }}
      >
        <span className="text-white tracking-tight">AB</span>
      </div>
      <div className="flex flex-col leading-none gap-0.5">
        <span className={`font-extrabold ${s.text} tracking-tight ${isLight ? 'text-white' : 'text-slate-900'}`}>
          Amazing<span style={{ color: '#7c3aed' }}>Brothers</span>
        </span>
        <span className={`${s.sub} font-medium tracking-widest uppercase ${isLight ? 'text-white/50' : 'text-slate-400'}`}>
          Adult Family Home
        </span>
      </div>
    </div>
  );
};

export default Logo;