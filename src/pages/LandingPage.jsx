import { useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';

const STATS = [
  { value: '15+', label: 'Years of Care' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Staff Coverage' },
  { value: '50+', label: 'Care Professionals' },
];

const SERVICES = [
  { icon: '🤝', title: 'Person-Centered Care', desc: 'Every resident honoured as an individual — their history, dignity and preferences at the centre of everything.' },
  { icon: '🏡', title: 'A True Home', desc: 'Warm, family-style environments where residents feel genuinely safe, loved, and at home.' },
  { icon: '💊', title: 'Skilled Health Support', desc: 'Trained staff providing medication management, personal care, and provider coordination.' },
  { icon: '🌿', title: 'Holistic Wellbeing', desc: 'Nurturing physical, emotional, and social wellbeing through meaningful connection and activities.' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0a0618', color: '#f1f0fe' }}>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: 'rgba(10,6,24,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}
      >
        <Logo size="md" variant="light" />
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {['About', 'Services', 'Our Homes', 'Contact'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="hover:text-white transition-colors duration-200 tracking-wide font-medium">
              {item}
            </a>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
          Staff Portal →
        </Button>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 overflow-hidden">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 animate-gradient"
            style={{ background: 'linear-gradient(135deg, #0a0618 0%, #1a0a3e 25%, #0d1040 50%, #0a0618 75%)', backgroundSize: '400% 400%' }} />
          <div className="absolute top-1/4 left-1/4 w-125 h-125 rounded-full opacity-20 animate-float"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full opacity-15 animate-float-delay"
            style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 right-1/3 w-75 h-75 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative z-10 max-w-5xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Licensed Adult Family Home · Est. 2009
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter mb-6">
            <span className="block text-white">Where Every</span>
            <span className="block gradient-text">Resident Feels</span>
            <span className="block text-white">at Home.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Amazing Brothers Adult Family Home delivers compassionate, person-centred
            residential care for adults — with the warmth and dedication of family.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/login')}>
              Staff Sign In →
            </Button>
            <Button variant="outline" size="lg">
              Learn About Our Care
            </Button>
          </div>
        </div>

        {/* Floating cards */}
        <div className="absolute left-8 top-1/3 hidden xl:block animate-float glass-card rounded-2xl p-4 w-52"
          style={{ border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 8px 32px rgba(16,185,129,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(16,185,129,0.2)' }}>✅</div>
            <span className="text-xs font-semibold text-white/70">Morning Tasks</span>
          </div>
          <div className="text-2xl font-black text-white mb-1">8<span className="text-sm font-normal text-white/40">/10</span></div>
          <div className="text-xs text-emerald-400">80% complete</div>
        </div>

        <div className="absolute right-8 top-1/2 hidden xl:block animate-float-delay glass-card rounded-2xl p-4 w-48"
          style={{ border: '1px solid rgba(124,58,237,0.25)', boxShadow: '0 8px 32px rgba(124,58,237,0.1)' }}>
          <div className="text-xs font-semibold text-white/50 mb-2">Residents Stable</div>
          <div className="text-3xl font-black text-white mb-1">4<span className="text-base font-normal text-white/40">/4</span></div>
          <div className="text-xs text-violet-400">All checked in ✓</div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 py-16 relative">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.12) 0%, rgba(236,72,153,0.08) 50%, rgba(6,182,212,0.08) 100%)' }} />
        <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div key={stat.label} className={`text-center animate-slide-up-${Math.min(i + 1, 4)}`}>
              <div className="text-4xl md:text-5xl font-black mb-2 gradient-text-cool">{stat.value}</div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3 text-violet-400">What Makes Us Different</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="text-white">Care </span>
              <span className="gradient-text">with Heart</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {SERVICES.map((s) => (
              <div key={s.title}
                className="group p-8 rounded-2xl transition-all duration-300 cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                  e.currentTarget.style.border = '1px solid rgba(124,58,237,0.3)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(124,58,237,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Staff CTA ── */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-10 md:p-14 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(236,72,153,0.12) 100%)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(236,72,153,0.3))', border: '1px solid rgba(124,58,237,0.4)' }}>
                🔐
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
                Staff Portal Access
              </h2>
              <p className="mb-8 max-w-md mx-auto leading-relaxed text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Manage resident care plans, shift schedules, incident reports, and
                daily care notes — all in one secure, beautiful platform.
              </p>
              <Button size="lg" onClick={() => navigate('/login')}>
                Sign In to Your Portal →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" variant="light" />
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>© {new Date().getFullYear()} Amazing Brothers Adult Family Home</span>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:text-violet-400 transition-colors">Privacy Policy</a>
            <span className="hidden md:inline">·</span>
            <a href="#" className="hover:text-violet-400 transition-colors">Staff Resources</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;