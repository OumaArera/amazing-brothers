/**
 * Reusable quick-action card — icon + title + description + arrow.
 * Used on both dashboards for the feature grid.
 */
import { useNavigate } from 'react-router-dom';

const QuickActionCard = ({ icon, label, desc, path, accent = '#7c3aed', badge }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="group w-full text-left p-5 rounded-2xl transition-all duration-250 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `rgba(${hexToRgb(accent)}, 0.08)`;
        e.currentTarget.style.border = `1px solid rgba(${hexToRgb(accent)}, 0.3)`;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(${hexToRgb(accent)}, 0.14)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `rgba(${hexToRgb(accent)}, 0.15)`, border: `1px solid rgba(${hexToRgb(accent)}, 0.2)` }}>
          {icon}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `rgba(${hexToRgb(accent)}, 0.2)`, color: accent }}>
              {badge}
            </span>
          )}
          <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <p className="text-sm font-bold text-white mb-1">{label}</p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
    </button>
  );
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

export default QuickActionCard;