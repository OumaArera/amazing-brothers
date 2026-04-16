import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { DarkSelect, ErrorBanner } from '../../components/ui/FormComponents';
import { useSleepPatterns, HOURS } from '../../hooks/useSleep';
import useResidents from '../../hooks/useResidents';

// ─── helpers ──────────────────────────────────────────────────────────────────

const today   = () => new Date().toISOString().slice(0, 10);
const fmtDate = iso => iso
  ? new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  : '—';

const SC = {
  asleep: { bg: 'rgba(99,102,241,0.25)', border: 'rgba(99,102,241,0.5)',  text: '#a5b4fc', label: 'Asleep' },
  awake:  { bg: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.4)',  text: '#fde68a', label: 'Awake'  },
  unset:  { bg: 'rgba(255,255,255,0.04)',border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.3)', label: '—' },
};

// ─── HourCell — tap to cycle unset → asleep → awake → unset ──────────────────

const HourCell = ({ hour, label, status, onToggle, readOnly }) => {
  const c = SC[status] ?? SC.unset;
  const inner = (
    <div className="flex flex-col items-center gap-0.5 py-2 px-0.5 rounded-xl text-center select-none"
      style={{ background: c.bg, border: `1px solid ${c.border}`, cursor: readOnly ? 'default' : 'pointer' }}>
      <span className="text-[8px] font-bold leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span className="text-[11px] font-black leading-none" style={{ color: c.text }}>
        {status === 'asleep' ? '😴' : status === 'awake' ? '👁' : '·'}
      </span>
    </div>
  );
  if (readOnly) return inner;
  return (
    <button type="button" onClick={() => onToggle(hour)}
      className="transition-opacity hover:opacity-75"
      style={{ display: 'block', width: '100%' }}>
      {inner}
    </button>
  );
};

// ─── 24-hour grid ─────────────────────────────────────────────────────────────

const SleepGrid = ({ hourMap, onToggle, readOnly = false }) => (
  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
    {HOURS.map(({ hour, label }) => (
      <HourCell key={hour} hour={hour} label={label}
        status={hourMap[hour] ?? 'unset'} onToggle={onToggle} readOnly={readOnly} />
    ))}
  </div>
);

// ─── Quick-fill toolbar ───────────────────────────────────────────────────────

const QuickFill = ({ onFill }) => (
  <div className="flex flex-wrap gap-2">
    <span className="text-xs font-bold uppercase tracking-widest self-center"
      style={{ color: 'rgba(255,255,255,0.35)' }}>Quick fill:</span>
    {[
      { label: 'All Asleep',    fn: () => onFill('all-asleep') },
      { label: 'Night Asleep',  fn: () => onFill('night-asleep')  },
      { label: 'All Awake',     fn: () => onFill('all-awake')  },
      { label: 'Clear All',     fn: () => onFill('clear')      },
    ].map(q => (
      <button key={q.label} type="button" onClick={q.fn}
        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
        style={{ background: 'rgba(124,58,237,0.14)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.14)'; }}>
        {q.label}
      </button>
    ))}
  </div>
);

// ─── Log Sleep Tab ────────────────────────────────────────────────────────────

const LogTab = ({ residents }) => {
  const [residentId, setResidentId] = useState('');
  const [date,       setDate]       = useState(today());
  const [hourMap,    setHourMap]    = useState({});
  const [formErr,    setFormErr]    = useState('');
  const [submitted,  setSubmitted]  = useState(false);

  const { patternByDate, saving, saveError, setSaveError, create, update } =
    useSleepPatterns(residentId || null);

  const existingPattern = residentId && date ? patternByDate[date] : null;

  // Pre-fill when switching to a date that has an existing pattern
  useEffect(() => {
    if (existingPattern) {
      const m = {};
      existingPattern.logs.forEach(l => { m[l.hour] = l.status; });
      setHourMap(m);
    } else {
      setHourMap({});
    }
  }, [existingPattern?.id, date, residentId]);

  const toggle = (hour) =>
    setHourMap(prev => {
      const cur = prev[hour];
      if (!cur)             return { ...prev, [hour]: 'asleep' };
      if (cur === 'asleep') return { ...prev, [hour]: 'awake'  };
      const next = { ...prev }; delete next[hour]; return next;
    });

  const quickFill = (mode) => {
    if (mode === 'clear')      { setHourMap({}); return; }
    if (mode === 'all-asleep') { setHourMap(Object.fromEntries(HOURS.map(h => [h.hour, 'asleep']))); return; }
    if (mode === 'all-awake')  { setHourMap(Object.fromEntries(HOURS.map(h => [h.hour, 'awake']))); return; }
    if (mode === 'night-asleep') {
      // 10 PM – 6 AM asleep, rest awake
      const m = {};
      HOURS.forEach(({ hour }) => {
        m[hour] = (hour >= 22 || hour <= 6) ? 'asleep' : 'awake';
      });
      setHourMap(m);
    }
  };

  const filledCount  = Object.keys(hourMap).length;
  const asleepCount  = Object.values(hourMap).filter(v => v === 'asleep').length;
  const awakeCount   = Object.values(hourMap).filter(v => v === 'awake').length;
  const unloggedHrs  = 24 - filledCount;

  const handleSubmit = async () => {
    if (!residentId) { setFormErr('Please select a resident'); return; }
    if (!date)       { setFormErr('Please select a date'); return; }
    if (filledCount === 0) { setFormErr('Please mark at least one hour before submitting'); return; }
    setFormErr('');
    const logs    = Object.entries(hourMap).map(([hour, status]) => ({ hour: Number(hour), status }));
    const payload = { resident_id: residentId, date, logs };
    const result  = existingPattern
      ? await update(existingPattern.id, payload)
      : await create(payload);
    if (result.success) setSubmitted(true);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>🌙</div>
      <div>
        <p className="text-lg font-black text-white mb-1">Sleep Pattern Saved!</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {asleepCount}h asleep · {awakeCount}h awake · logged for {fmtDate(date)}
        </p>
      </div>
      <Button variant="ghost" size="md" onClick={() => { setSubmitted(false); setHourMap({}); }}>Log Another Day</Button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Resident + Date */}
      <div className="grid sm:grid-cols-2 gap-4 p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <DarkSelect label="Resident *" value={residentId}
          onChange={e => { setResidentId(e.target.value); setFormErr(''); if (saveError) setSaveError(null); }}
          options={residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` }))}
          placeholder="Select resident…"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Date *</label>
          <input type="date" value={date} max={today()}
            onChange={e => { setDate(e.target.value); setFormErr(''); }}
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
          />
        </div>
      </div>

      {/* Today not logged banner — shown when selected date is today and no pattern yet */}
      {residentId && date === today() && !existingPattern && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span>⚠️</span>
          <p className="text-sm text-red-300 font-semibold">
            Today's sleep pattern has not been logged for this resident yet.
          </p>
        </div>
      )}

      {/* Existing pattern notice */}
      {existingPattern && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <p className="text-xs text-amber-300 font-semibold">
            A pattern already exists for this date — editing will update it.
          </p>
        </div>
      )}

      {/* Legend + Quick fill */}
      {residentId && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap px-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Tap to cycle:</p>
            {[
              { key: 'unset',  label: '· Unset'  },
              { key: 'asleep', label: '😴 Asleep' },
              { key: 'awake',  label: '👁 Awake'  },
            ].map(l => (
              <span key={l.key} className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                style={{ background: SC[l.key].bg, border: `1px solid ${SC[l.key].border}`, color: SC[l.key].text }}>
                {l.label}
              </span>
            ))}
          </div>
          <QuickFill onFill={quickFill} />
        </div>
      )}

      {/* Progress bar */}
      {filledCount > 0 && (
        <div className="flex gap-4 px-4 py-3 rounded-xl items-center"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold" style={{ color: '#a78bfa' }}>Hours Logged</span>
              <span className="font-black text-white">{filledCount}/24</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ width: `${(asleepCount / 24) * 100}%`, background: '#6366f1', transition: 'width 0.3s' }} />
              <div style={{ width: `${(awakeCount  / 24) * 100}%`, background: '#fbbf24', transition: 'width 0.3s' }} />
            </div>
          </div>
          <div className="flex gap-3 text-xs shrink-0">
            <span style={{ color: '#a5b4fc' }}>😴 {asleepCount}h</span>
            <span style={{ color: '#fde68a' }}>👁 {awakeCount}h</span>
            {unloggedHrs > 0 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>· {unloggedHrs}h unset</span>}
          </div>
        </div>
      )}

      <ErrorBanner message={saveError || formErr} />

      {/* 24-hour grid */}
      {residentId ? (
        <div className="p-4 rounded-2xl space-y-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
            24-Hour Sleep Chart — {fmtDate(date)}
          </p>
          <SleepGrid hourMap={hourMap} onToggle={toggle} />
        </div>
      ) : (
        <div className="text-center py-10 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/50 text-sm">Select a resident to begin logging</p>
        </div>
      )}

      {residentId && (
        <Button variant="primary" size="lg" fullWidth loading={saving} onClick={handleSubmit}>
          {saving ? 'Saving…' : existingPattern ? 'Update Sleep Pattern' : 'Save Sleep Pattern'}
        </Button>
      )}
    </div>
  );
};

// ─── History Tab ──────────────────────────────────────────────────────────────

const HistoryTab = ({ residents }) => {
  const [residentId, setResidentId] = useState('');
  const { patterns, loading, error, refetch } = useSleepPatterns(residentId || null);
  const [expanded, setExpanded]               = useState(null);

  const todayStr    = today();
  const todayLogged = patterns.some(p => p.date === todayStr);

  // Group consecutive unlogged days in last 7
  const last7 = useMemo(() => {
    if (!residentId) return [];
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      out.push({ date: ds, logged: patterns.some(p => p.date === ds) });
    }
    return out;
  }, [patterns, residentId]);

  return (
    <div className="space-y-4">
      <DarkSelect label="Resident" value={residentId}
        onChange={e => { setResidentId(e.target.value); setExpanded(null); }}
        options={[
          { value: '', label: 'Select resident…' },
          ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
        ]}
      />

      {/* Today not logged alert */}
      {residentId && !todayLogged && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span>⚠️</span>
          <p className="text-sm text-red-300 font-semibold">Today's sleep pattern has not been logged yet.</p>
        </div>
      )}

      {/* Last 7 days compliance row */}
      {residentId && (
        <div className="px-4 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.35)' }}>Last 7 Days</p>
          <div className="flex gap-2">
            {last7.map(({ date: d, logged }) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full h-6 rounded-lg"
                  style={{ background: logged ? 'rgba(99,102,241,0.4)' : 'rgba(239,68,68,0.25)', border: `1px solid ${logged ? 'rgba(99,102,241,0.6)' : 'rgba(239,68,68,0.4)'}` }} />
                <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {new Date(d + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'short' }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#a5b4fc' }}>
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(99,102,241,0.4)' }} /> Logged
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: '#f87171' }}>
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(239,68,68,0.25)' }} /> Missing
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
        </div>
      )}
      {!loading && error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}
      {!loading && !error && residentId && patterns.length === 0 && (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-4xl mb-3">🌙</p>
          <p className="text-white/50 text-sm">No sleep patterns recorded yet.</p>
        </div>
      )}

      {!loading && patterns.map(pattern => {
        const logs    = pattern.logs ?? [];
        const hourMap = Object.fromEntries(logs.map(l => [l.hour, l.status]));
        const asleep  = logs.filter(l => l.status === 'asleep').length;
        const awake   = logs.filter(l => l.status === 'awake').length;
        const missing = 24 - logs.length;
        const isOpen  = expanded === pattern.id;

        return (
          <div key={pattern.id} className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button"
              className="w-full flex items-center gap-4 px-5 py-4 transition-all text-left"
              onClick={() => setExpanded(isOpen ? null : pattern.id)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              {/* Date pill */}
              <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                <p className="text-xs font-bold text-violet-400 leading-none">
                  {new Date(pattern.date + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short' }).toUpperCase()}
                </p>
                <p className="text-base font-black text-white leading-none mt-0.5">
                  {new Date(pattern.date + 'T00:00:00').getDate()}
                </p>
              </div>
              {/* Summary */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{fmtDate(pattern.date)}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: SC.asleep.bg, color: SC.asleep.text }}>😴 {asleep}h</span>
                  <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: SC.awake.bg,  color: SC.awake.text  }}>👁 {awake}h</span>
                  {missing > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                      ⚠ {missing}h unlogged
                    </span>
                  )}
                </div>
              </div>
              {/* Mini bar */}
              <div className="hidden sm:flex gap-px h-8 items-end shrink-0">
                {HOURS.map(({ hour }) => {
                  const s = hourMap[hour];
                  return (
                    <div key={hour} style={{
                      width: 5, height: s === 'asleep' ? 32 : s === 'awake' ? 16 : 4,
                      borderRadius: 2,
                      background: s === 'asleep' ? '#6366f1' : s === 'awake' ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                    }} />
                  );
                })}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform duration-200"
                style={{ color: 'rgba(255,255,255,0.35)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs uppercase tracking-widest my-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Full 24-hour view
                </p>
                <SleepGrid hourMap={hourMap} onToggle={() => {}} readOnly />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'log',     label: 'Log Sleep', icon: '🌙', desc: "Record today's sleep/wake pattern hour by hour" },
  { id: 'history', label: 'History',   icon: '📋', desc: 'Review past entries and check compliance'       },
];

const CaregiverSleep = () => {
  const [activeTab, setActiveTab] = useState('log');
  const { residents }             = useResidents();
  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Sleep Patterns" pageSubtitle="Log and review resident sleep data">
      <div className="space-y-5 animate-slide-up">
        <div className="flex gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={activeTab === tab.id ? {
                background: 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(168,85,247,0.2))',
                color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 4px 16px rgba(124,58,237,0.15)',
              } : { color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }}>
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <div>
            <h2 className="text-base font-black text-white">{current.label}</h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{current.desc}</p>
          </div>
        </div>
        {activeTab === 'log'     && <LogTab     residents={residents} />}
        {activeTab === 'history' && <HistoryTab residents={residents} />}
      </div>
    </DashboardLayout>
  );
};

export default CaregiverSleep;