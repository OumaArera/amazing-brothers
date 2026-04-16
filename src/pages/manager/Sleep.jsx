import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { DarkSelect } from '../../components/ui/FormComponents';
import { useAllSleepPatterns, HOURS } from '../../hooks/useSleep';
import useResidents from '../../hooks/useResidents';

// ─── helpers ──────────────────────────────────────────────────────────────────

const today   = () => new Date().toISOString().slice(0, 10);
const fmtDate = iso => iso
  ? new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })
  : '—';

const SLEEP_C = { bg: 'rgba(99,102,241,0.22)',  border: 'rgba(99,102,241,0.4)',  text: '#a5b4fc' };
const AWAKE_C = { bg: 'rgba(251,191,36,0.18)',  border: 'rgba(251,191,36,0.35)', text: '#fde68a' };
const NONE_C  = { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.2)' };

// ─── Mini sleep bar ───────────────────────────────────────────────────────────

const SleepBar = ({ logs = [] }) => {
  const map = Object.fromEntries(logs.map(l => [l.hour, l.status]));
  return (
    <div className="flex gap-px h-5">
      {HOURS.map(({ hour }) => {
        const s = map[hour];
        return (
          <div key={hour} className="flex-1 rounded-sm"
            style={{ background: s === 'asleep' ? '#6366f1' : s === 'awake' ? '#fbbf24' : 'rgba(255,255,255,0.08)' }} />
        );
      })}
    </div>
  );
};

// ─── Compliance Calendar (30-day grid per resident) ───────────────────────────

const ComplianceCalendar = ({ patterns, residents }) => {
  const [residentId, setResidentId] = useState('');

  // Build last 30 days
  const days = useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }, []);

  const loggedDates = useMemo(() => {
    const src = residentId
      ? patterns.filter(p => String(p.resident) === residentId)
      : patterns;
    return new Set(src.map(p => p.date));
  }, [patterns, residentId]);

  const compliance = Math.round((days.filter(d => loggedDates.has(d)).length / 30) * 100);

  const residentOptions = [
    { value: '', label: 'All Residents' },
    ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="max-w-xs flex-1">
          <DarkSelect label="" value={residentId}
            onChange={e => setResidentId(e.target.value)}
            options={residentOptions} />
        </div>
        <div className="px-4 py-2 rounded-xl shrink-0"
          style={{ background: compliance >= 80 ? 'rgba(16,185,129,0.15)' : compliance >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${compliance >= 80 ? 'rgba(16,185,129,0.3)' : compliance >= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          <p className="text-xs font-bold" style={{ color: compliance >= 80 ? '#34d399' : compliance >= 50 ? '#fbbf24' : '#f87171' }}>
            30-day compliance: {compliance}%
          </p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {days.map(d => {
          const logged  = loggedDates.has(d);
          const isToday = d === today();
          const dayNum  = new Date(d + 'T00:00:00').getDate();
          const mon     = new Date(d + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short' });
          return (
            <div key={d}
              className="flex flex-col items-center justify-center rounded-xl py-2 gap-0.5"
              style={{
                background: logged ? 'rgba(99,102,241,0.25)' : 'rgba(239,68,68,0.12)',
                border: isToday
                  ? '2px solid rgba(124,58,237,0.7)'
                  : `1px solid ${logged ? 'rgba(99,102,241,0.4)' : 'rgba(239,68,68,0.25)'}`,
              }}>
              <span className="text-xs font-black leading-none" style={{ color: logged ? '#a5b4fc' : '#f87171' }}>
                {dayNum}
              </span>
              <span className="text-[8px] leading-none" style={{ color: 'rgba(255,255,255,0.35)' }}>{mon}</span>
              <span className="text-[9px] leading-none">{logged ? '✓' : '✗'}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 px-1">
        <span className="text-xs flex items-center gap-1.5" style={{ color: '#a5b4fc' }}>
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(99,102,241,0.4)' }} /> Logged
        </span>
        <span className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}>
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(239,68,68,0.25)' }} /> Missing
        </span>
        <span className="text-xs flex items-center gap-1.5" style={{ color: '#a78bfa' }}>
          <span className="w-3 h-3 rounded-sm inline-block" style={{ border: '2px solid rgba(124,58,237,0.7)', background: 'transparent' }} /> Today
        </span>
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab = ({ patterns, residents, loading }) => {
  const [residentFilter, setResidentFilter] = useState('');

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );

  const todayStr = today();

  const displayed = useMemo(() => {
    const sorted = [...patterns].sort((a, b) => b.date.localeCompare(a.date));
    if (!residentFilter) return sorted;
    return sorted.filter(p => String(p.resident) === residentFilter);
  }, [patterns, residentFilter]);

  const missingToday = useMemo(() => {
    const logged = new Set(patterns.filter(p => p.date === todayStr).map(p => String(p.resident)));
    return residents.filter(r => !logged.has(String(r.id)));
  }, [patterns, residents, todayStr]);

  return (
    <div className="space-y-5">
      {/* Missing today alert */}
      {missingToday.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            <span>⚠️</span>
            <p className="text-sm font-bold text-red-400">Missing today's sleep log</p>
            <span className="ml-auto text-xs text-red-400">{missingToday.length} resident{missingToday.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="px-5 py-3 flex flex-wrap gap-2">
            {missingToday.map(r => (
              <span key={r.id} className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {r.first_name} {r.last_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="max-w-xs">
        <DarkSelect label="" value={residentFilter}
          onChange={e => setResidentFilter(e.target.value)}
          options={[{ value: '', label: 'All Residents' }, ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` }))]}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
          <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
        </div>
      )}

      {!loading && displayed.length === 0 && (
        <div className="text-center py-14 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-3xl mb-3">🌙</p>
          <p className="text-white/50 text-sm">No sleep patterns recorded yet.</p>
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="col-span-3">Resident</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-5">Sleep Bar (12AM → 11PM)</div>
            <div className="col-span-1 text-center">😴</div>
            <div className="col-span-1 text-center">👁</div>
          </div>
          {displayed.map((p, i) => {
            const logs    = p.logs ?? [];
            const asleep  = logs.filter(l => l.status === 'asleep').length;
            const awake   = logs.filter(l => l.status === 'awake').length;
            const missing = 24 - logs.length;
            const name    = p.resident_name ?? residentMap[String(p.resident)] ?? 'Unknown';
            return (
              <div key={p.id}
                className="grid grid-cols-12 gap-3 px-5 py-3 items-center transition-all"
                style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div className="col-span-3">
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-white/60">{fmtDate(p.date)}</p>
                  {missing > 0 && <p className="text-[10px] text-red-400">{missing}h missing</p>}
                </div>
                <div className="col-span-5"><SleepBar logs={logs} /></div>
                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold" style={{ color: '#a5b4fc' }}>{asleep}h</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold" style={{ color: '#fde68a' }}>{awake}h</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────

const AnalyticsTab = ({ patterns, residents }) => {
  const [residentId, setResidentId] = useState('');

  const filtered = useMemo(() =>
    residentId ? patterns.filter(p => String(p.resident) === residentId) : patterns,
    [patterns, residentId]
  );

  // Per-hour average asleep/awake rate across filtered days
  const hourStats = useMemo(() => {
    const counts = Array.from({ length: 24 }, () => ({ asleep: 0, awake: 0, total: 0 }));
    filtered.forEach(p => {
      (p.logs ?? []).forEach(l => {
        counts[l.hour].total++;
        if (l.status === 'asleep') counts[l.hour].asleep++;
        else counts[l.hour].awake++;
      });
    });
    return counts.map((c, hour) => ({
      hour,
      label:       HOURS[hour].label,
      asleepRate:  c.total > 0 ? c.asleep / c.total : 0,
      awakeRate:   c.total > 0 ? c.awake  / c.total : 0,
      total:       c.total,
    }));
  }, [filtered]);

  // Per-day totals
  const dailyStats = useMemo(() =>
    filtered.map(p => {
      const logs   = p.logs ?? [];
      const asleep = logs.filter(l => l.status === 'asleep').length;
      const awake  = logs.filter(l => l.status === 'awake').length;
      return { date: p.date, asleep, awake, logged: logs.length };
    }).sort((a, b) => a.date.localeCompare(b.date)),
    [filtered]
  );

  // Sleep window detection: earliest asleep hour and latest asleep hour on average
  const sleepWindow = useMemo(() => {
    if (dailyStats.length === 0) return null;
    const eveningHours = [20, 21, 22, 23, 0, 1, 2, 3]; // likely bedtime hours
    const morningHours = [5, 6, 7, 8, 9, 10];           // likely wake hours
    const bedtimeRate  = eveningHours.reduce((s, h) => s + (hourStats[h]?.asleepRate ?? 0), 0) / eveningHours.length;
    const waketimeRate = morningHours.reduce((s, h) => s + (hourStats[h]?.asleepRate ?? 0), 0) / morningHours.length;
    return { bedtimeRate, waketimeRate };
  }, [hourStats, dailyStats]);

  // Sleep fragmentation: count of asleep→awake transitions per day averaged
  const avgFragmentation = useMemo(() => {
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, p) => {
      const logs = (p.logs ?? []).sort((a, b) => a.hour - b.hour);
      let transitions = 0;
      for (let i = 1; i < logs.length; i++) {
        if (logs[i - 1].status === 'asleep' && logs[i].status === 'awake') transitions++;
      }
      return sum + transitions;
    }, 0);
    return (total / filtered.length).toFixed(1);
  }, [filtered]);

  // Insights
  const insights = useMemo(() => {
    if (dailyStats.length === 0) return [];
    const avgSleep = dailyStats.reduce((s, d) => s + d.asleep, 0) / dailyStats.length;
    const avgAwake = dailyStats.reduce((s, d) => s + d.awake,  0) / dailyStats.length;
    const list = [];

    // Sleep duration insight
    if (avgSleep < 6)
      list.push({ icon: '⚠️', sev: 'high',
        text: `Average sleep is only ${avgSleep.toFixed(1)}h/day — below the recommended 7–9 hours. Review care plan and evening routine.` });
    else if (avgSleep >= 10)
      list.push({ icon: '💤', sev: 'warn',
        text: `Average sleep is ${avgSleep.toFixed(1)}h/day — above 10h may indicate excessive sedation, depression, or underlying health concerns.` });
    else
      list.push({ icon: '✅', sev: 'good',
        text: `Sleep average is ${avgSleep.toFixed(1)}h/day — within a healthy range.` });

    // Night-time awake check (midnight–5 AM)
    const nightAwakeRate = hourStats.slice(0, 6).reduce((s, h) => s + h.awakeRate, 0) / 6;
    if (nightAwakeRate > 0.35)
      list.push({ icon: '🌜', sev: 'high',
        text: `High night-time wakefulness: ${Math.round(nightAwakeRate * 100)}% of midnight–5 AM hours are marked awake on average. Possible sleep disturbances or anxiety.` });

    // Sleep fragmentation
    if (Number(avgFragmentation) >= 3)
      list.push({ icon: '🔀', sev: 'warn',
        text: `Average ${avgFragmentation} sleep-to-wake transitions per night — fragmented sleep may be affecting rest quality.` });
    else if (Number(avgFragmentation) > 0)
      list.push({ icon: '🔀', sev: 'good',
        text: `Sleep transitions average ${avgFragmentation}/night — relatively consolidated sleep.` });

    // Compliance check
    const missingDays = dailyStats.filter(d => d.logged < 24).length;
    if (missingDays > 0)
      list.push({ icon: '📋', sev: 'warn',
        text: `${missingDays} day${missingDays !== 1 ? 's' : ''} have fewer than 24 hours logged — incomplete data may affect accuracy.` });

    // Consistency (std dev of daily sleep hours)
    if (dailyStats.length >= 5) {
      const mean = avgSleep;
      const variance = dailyStats.reduce((s, d) => s + Math.pow(d.asleep - mean, 2), 0) / dailyStats.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 2.5)
        list.push({ icon: '📉', sev: 'warn',
          text: `Sleep duration is highly variable (±${stdDev.toFixed(1)}h std dev). Inconsistent sleep patterns may indicate an irregular routine.` });
      else
        list.push({ icon: '📈', sev: 'good',
          text: `Sleep duration is consistent (±${stdDev.toFixed(1)}h variation) — good routine stability.` });
    }

    return list;
  }, [dailyStats, hourStats, avgFragmentation]);

  const sevStyle = {
    high: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)'    },
    warn: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)'   },
    good: { color: '#34d399', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.25)'   },
  };

  if (patterns.length === 0) return (
    <div className="text-center py-14 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-3xl mb-3">📊</p>
      <p className="text-white/50 text-sm">No sleep data available for analysis yet.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Resident filter */}
      <div className="max-w-xs">
        <DarkSelect label="Filter by Resident" value={residentId}
          onChange={e => setResidentId(e.target.value)}
          options={[{ value: '', label: 'All Residents' }, ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` }))]}
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const s = sevStyle[ins.sev];
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <span className="shrink-0 mt-0.5">{ins.icon}</span>
                <p className="text-sm" style={{ color: s.color }}>{ins.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stat cards */}
      {dailyStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Days Logged',    value: dailyStats.length,                                                      unit: '',      color: '#a78bfa', bg: 'rgba(124,58,237,0.12)' },
            { label: 'Avg Sleep',      value: (dailyStats.reduce((s,d)=>s+d.asleep,0)/dailyStats.length).toFixed(1), unit: 'h/day', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)' },
            { label: 'Avg Awake',      value: (dailyStats.reduce((s,d)=>s+d.awake,0)/dailyStats.length).toFixed(1),  unit: 'h/day', color: '#fde68a', bg: 'rgba(251,191,36,0.12)' },
            { label: 'Fragmentation',  value: avgFragmentation,                                                        unit: 'trans/night', color: '#f9a8d4', bg: 'rgba(236,72,153,0.12)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
              style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
              <p className="text-2xl font-black" style={{ color: s.color }}>
                {s.value}<span className="text-xs font-semibold ml-1">{s.unit}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: s.color + 'aa' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hourly heatmap */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 className="text-sm font-bold text-white">Hourly Sleep Pattern Heatmap</h4>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Average probability of being asleep at each hour across all logged days
          </p>
        </div>
        <div className="px-5 py-4 space-y-1.5">
          {hourStats.map(h => (
            <div key={h.hour} className="flex items-center gap-3">
              <span className="text-[10px] w-10 shrink-0 text-right font-semibold"
                style={{ color: 'rgba(255,255,255,0.4)' }}>{h.label}</span>
              <div className="flex-1 h-4 rounded-md overflow-hidden flex"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: `${h.asleepRate * 100}%`, background: 'linear-gradient(90deg,#4f46e5,#6366f1)', transition: 'width 0.4s' }} />
                <div style={{ width: `${h.awakeRate  * 100}%`, background: 'linear-gradient(90deg,#d97706,#fbbf24)', transition: 'width 0.4s' }} />
              </div>
              <span className="text-[10px] w-8 shrink-0 text-right font-bold" style={{ color: '#a5b4fc' }}>
                {Math.round(h.asleepRate * 100)}%
              </span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4 flex gap-4">
          {[['#6366f1', '😴 Asleep'], ['#fbbf24', '👁 Awake']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily sleep trend */}
      {dailyStats.length > 1 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 className="text-sm font-bold text-white">Daily Sleep Totals</h4>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Hours asleep and awake per logged day
            </p>
          </div>
          <div className="px-5 py-4 space-y-1.5 max-h-64 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {dailyStats.map(d => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-[10px] w-16 shrink-0 font-semibold"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 h-4 rounded-md overflow-hidden flex"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div title={`${d.asleep}h asleep`}
                    style={{ width: `${(d.asleep / 24) * 100}%`, background: 'linear-gradient(90deg,#4f46e5,#6366f1)' }} />
                  <div title={`${d.awake}h awake`}
                    style={{ width: `${(d.awake / 24) * 100}%`, background: 'linear-gradient(90deg,#d97706,#fbbf24)' }} />
                </div>
                <span className="text-[10px] w-8 shrink-0 text-right font-bold" style={{ color: d.asleep < 6 ? '#f87171' : '#a5b4fc' }}>
                  {d.asleep}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: '📋', desc: 'All residents — recent sleep entries'     },
  { id: 'compliance', label: 'Compliance', icon: '📅', desc: '30-day logging compliance calendar'       },
  { id: 'analytics',  label: 'Analytics',  icon: '📊', desc: 'Patterns, insights and sleep quality trends' },
];

const ManagerSleep = () => {
  const [activeTab, setActiveTab]    = useState('overview');
  const { residents }                = useResidents();
  const { patterns, loading, error } = useAllSleepPatterns();
  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Sleep Patterns" pageSubtitle="Review and analyse resident sleep data">
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
              <span className="hidden sm:inline">{tab.label}</span>
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
        {error && <p className="text-red-400 text-sm text-center py-4">{error}</p>}
        {activeTab === 'overview'   && <OverviewTab    patterns={patterns} residents={residents} loading={loading} />}
        {activeTab === 'compliance' && <ComplianceCalendar patterns={patterns} residents={residents} />}
        {activeTab === 'analytics'  && <AnalyticsTab   patterns={patterns} residents={residents} />}
      </div>
    </DashboardLayout>
  );
};

export default ManagerSleep;