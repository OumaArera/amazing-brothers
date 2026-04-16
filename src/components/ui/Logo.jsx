const Logo = ({ size = 'md', variant = 'dark', className = '' }) => {
  const sizes = {
    sm: { img: 'h-7', text: 'text-sm',  sub: 'text-[9px]'  },
    md: { img: 'h-9', text: 'text-base', sub: 'text-[10px]' },
    lg: { img: 'h-12', text: 'text-xl',  sub: 'text-xs'     },
  };

  const s = sizes[size];
  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="Amazing Brothers Adult Family Home"
        className={`${s.img} w-auto object-contain`}
        style={isLight ? { filter: 'brightness(0) invert(1)' } : {}}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />

      {/* Fallback badge — shown only if /logo.png fails to load */}
      <div
        style={{
          display: 'none',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
          boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
        }}
        className={`${s.img} aspect-square rounded-xl items-center justify-center font-black text-white text-xs`}
      >
        AB
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