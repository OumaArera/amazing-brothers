

const StatCard = ({ icon, label, value, sub, gradient, glow, delay = 0 }) => (
  <div
    className="relative rounded-2xl p-5 overflow-hidden cursor-default transition-all duration-300"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      animationDelay: `${delay}ms`,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = `0 16px 40px ${glow}`;
      e.currentTarget.style.border = `1px solid ${glow.replace('0.35', '0.4')}`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
    }}
  >
    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: gradient }} />
    <div className="text-2xl mb-3">{icon}</div>
    <div className="text-3xl font-black text-white mb-1">{value}</div>
    <div className="text-xs font-bold text-white/80 mb-0.5">{label}</div>
    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
  </div>
);

export default StatCard;