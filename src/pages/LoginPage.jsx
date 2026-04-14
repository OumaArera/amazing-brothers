import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useLogin } from '../hooks/useLogin';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { handleLogin, loading, error, clearError } = useLogin();

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
   
    return errors;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    clearError();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    handleLogin({ email, password });
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0618' }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-14 overflow-hidden">
        {/* Animated bg */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 animate-gradient"
            style={{ background: 'linear-gradient(135deg, #0a0618 0%, #150933 40%, #0d1040 70%, #0a0618 100%)', backgroundSize: '300% 300%' }} />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-25 animate-float"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-15 animate-float-delay"
            style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
        </div>
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link to="/"><Logo size="lg" variant="light" /></Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Staff Portal
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight mb-4">
              <span className="text-white">Caring for residents</span><br />
              <span className="text-white">starts with caring</span><br />
              <span className="gradient-text">for our team.</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Everything you need for your shift — care plans, medications,
              incident logs, and daily notes — in one beautiful, secure platform.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2">
            {['Care Plans', 'Shift Notes', 'Med Records', 'Incidents', 'Schedules'].map((tag) => (
              <span key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Glassmorphism preview card */}
          <div className="rounded-2xl p-5 space-y-3 max-w-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Today's Residents</span>
              <span className="text-xs font-bold text-emerald-400">All Stable</span>
            </div>
            {[
              { name: 'Margaret W.', room: '1A', status: 'emerald' },
              { name: 'Robert H.', room: '1B', status: 'amber' },
              { name: 'Dorothy K.', room: '2A', status: 'emerald' },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  {r.name[0]}
                </div>
                <span className="text-sm font-medium text-white/80 flex-1">{r.name}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Rm {r.room}</span>
                <div className={`w-2 h-2 rounded-full ${r.status === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span>© {new Date().getFullYear()} Amazing Brothers AFH</span>
          <span>·</span>
          <a href="#" className="hover:text-violet-400 transition-colors">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:text-violet-400 transition-colors">Terms</a>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative"
        style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link to="/"><Logo size="md" variant="light" /></Link>
        </div>

        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))', border: '1px solid rgba(124,58,237,0.4)' }}>
              👋
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Sign in to access your staff portal</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <Input
              label="Work Email"
              id="email"
              type="email"
              placeholder="you@amazingbrothers.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })); }}
              error={fieldErrors.email}
              autoComplete="email"
              dark
            />
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })); }}
              error={fieldErrors.password}
              autoComplete="current-password"
              dark
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <input type="checkbox" className="rounded accent-violet-500 w-4 h-4"
                  style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }} />
                Keep me signed in
              </label>
              <a href="#" className="text-violet-400 hover:text-violet-300 font-medium transition-colors text-sm">
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-1">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-2xl text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Having trouble?{' '}
              <a href="mailto:admin@amazingbrothers.com"
                className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
                Contact your administrator
              </a>
            </p>
          </div>

          <p className="lg:hidden text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <Link to="/" className="hover:text-violet-400 transition-colors">← Back to website</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;