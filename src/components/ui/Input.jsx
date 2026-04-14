import { useState } from 'react';

const Input = ({ label, id, type = 'text', error, dark = false, className = '', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={`text-sm font-semibold ${dark ? 'text-white/70' : 'text-slate-600'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={resolvedType}
          className={`
            w-full border rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none
            ${dark
              ? 'bg-white/8 border-white/12 text-white placeholder-white/30 focus:border-violet-400/60 focus:bg-white/12 focus:ring-2 focus:ring-violet-500/20'
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20'
            }
            ${error ? (dark ? 'border-red-400/50! bg-red-900/20!' : 'border-red-300! bg-red-50!') : ''}
            ${isPassword ? 'pr-12' : ''}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${dark ? 'text-white/30 hover:text-violet-400' : 'text-slate-400 hover:text-violet-600'}`}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p className={`text-xs flex items-center gap-1 mt-0.5 ${dark ? 'text-red-400' : 'text-red-500'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;