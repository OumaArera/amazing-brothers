import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import {
  DarkInput, DarkSelect, ModalShell, ErrorBanner,
} from '../../components/ui/FormComponents';
import useAppointments from '../../hooks/useAppointments';
import useResidents from '../../hooks/useResidents';

// ─── constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = [
  'Primary Care Provider (PCP)',
  'Mental Health Provider / Physician/ Prescriber',
  'Clinician',
  'Peer Support Counsellor',
  'Counsellor',
  'Dentist',
  'Specialist',
  'Other',
].map(v => ({ value: v, label: v }));

const TYPE_SHORT = {
  'Primary Care Provider (PCP)':                    'PCP',
  'Mental Health Provider / Physician/ Prescriber': 'Mental Health',
  'Clinician':                                      'Clinician',
  'Peer Support Counsellor':                        'Peer Support',
  'Counsellor':                                     'Counsellor',
  'Dentist':                                        'Dentist',
  'Specialist':                                     'Specialist',
  'Other':                                          'Other',
};

const TYPE_COLORS = [
  { bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa', border: 'rgba(124,58,237,0.3)'  },
  { bg: 'rgba(6,182,212,0.15)',   color: '#22d3ee', border: 'rgba(6,182,212,0.3)'   },
  { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
  { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
  { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  { bg: 'rgba(236,72,153,0.15)',  color: '#f472b6', border: 'rgba(236,72,153,0.3)'  },
  { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)'  },
  { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
];

const typeColor = (type) =>
  TYPE_COLORS[APPOINTMENT_TYPES.findIndex(t => t.value === type) % TYPE_COLORS.length] ?? TYPE_COLORS[7];

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = iso =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—';

const today = () => new Date().toISOString().slice(0, 10);

const daysUntil = iso => {
  if (!iso) return null;
  const diff = new Date(iso + 'T00:00:00').setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
};

const nextBadge = iso => {
  const d = daysUntil(iso);
  if (d === null) return null;
  if (d < 0)   return { label: `${Math.abs(d)}d overdue`, color: '#f87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' };
  if (d === 0) return { label: 'Today!',                  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
  if (d === 1) return { label: 'Tomorrow',                color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' };
  if (d <= 14) return { label: `In ${d} days`,            color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' };
  return               { label: `In ${d} days`,            color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)' };
};

// ─── Appointment form (shared by Create and Edit modals) ──────────────────────

const EMPTY_FORM = {
  resident:             '',
  date_taken:           today(),
  type:                 '',
  details:              '',
  next_appointment_date: '',
};

const AppointmentForm = ({ form, setForm, errs, residents, isEdit = false }) => {
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const residentOptions = residents.map(r => ({
    value: String(r.id),
    label: `${r.first_name} ${r.last_name}`,
  }));

  const dateInputStyle = (hasErr = false) => ({
    background: 'rgba(255,255,255,0.07)',
    border: hasErr ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    colorScheme: 'dark',
  });

  return (
    <div className="space-y-4">
      {/* Resident (read-only in edit — changing resident would reassign) */}
      {!isEdit ? (
        <DarkSelect
          label="Resident *"
          value={form.resident}
          onChange={set('resident')}
          options={residentOptions}
          placeholder="Select resident…"
          error={errs.resident}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Resident</label>
          <div className="w-full text-sm rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
            {residentOptions.find(r => r.value === form.resident)?.label ?? '—'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Date taken */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Appointment Date *
          </label>
          <input type="date" value={form.date_taken} onChange={set('date_taken')}
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
            style={dateInputStyle(errs.date_taken)}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = errs.date_taken ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
          />
          {errs.date_taken && <p className="text-xs text-red-400">{errs.date_taken}</p>}
        </div>

        {/* Type */}
        <DarkSelect
          label="Appointment Type *"
          value={form.type}
          onChange={set('type')}
          options={APPOINTMENT_TYPES}
          placeholder="Select type…"
          error={errs.type}
        />
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Details / Notes *
        </label>
        <textarea rows={4} value={form.details} onChange={set('details')}
          placeholder="Describe the appointment — provider seen, reason, outcomes, medications changed…"
          className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: errs.details ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
            color: '#fff', colorScheme: 'dark',
          }}
          onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
          onBlur={e => { e.target.style.border = errs.details ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
        />
        {errs.details && <p className="text-xs text-red-400">{errs.details}</p>}
      </div>

      {/* Next appointment */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Next Appointment Date
          <span className="ml-1 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>(optional)</span>
        </label>
        <input type="date" value={form.next_appointment_date} onChange={set('next_appointment_date')}
          className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
          style={dateInputStyle()}
          onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
          onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
        />
        {form.next_appointment_date && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {fmt(form.next_appointment_date)}
            {(() => { const d = daysUntil(form.next_appointment_date); return d !== null ? ` · ${d >= 0 ? `in ${d} day${d !== 1 ? 's' : ''}` : `${Math.abs(d)}d past`}` : ''; })()}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Create Modal ─────────────────────────────────────────────────────────────

const CreateModal = ({ residents, onClose, onSuccess, saving, saveError, setSaveError, createAppointment }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errs, setErrs] = useState({});

  const validate = () => {
    const e = {};
    if (!form.resident)         e.resident   = 'Select a resident';
    if (!form.date_taken)       e.date_taken = 'Select a date';
    if (!form.type)             e.type       = 'Select appointment type';
    if (!form.details.trim())   e.details    = 'Notes are required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const payload = {
      resident:              form.resident,
      date_taken:            form.date_taken,
      type:                  form.type,
      details:               form.details.trim(),
      ...(form.next_appointment_date ? { next_appointment_date: form.next_appointment_date } : {}),
    };
    const result = await createAppointment(payload);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Log Appointment" subtitle="Record a resident appointment and any follow-up" onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />
        <AppointmentForm form={form} setForm={setForm} errs={errs} residents={residents} />
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Saving…' : 'Log Appointment'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({ appt, residents, onClose, onSuccess, saving, saveError, setSaveError, updateAppointment }) => {
  const [form, setForm] = useState({
    resident:              String(appt.resident),
    date_taken:            appt.date_taken ?? today(),
    type:                  appt.type ?? '',
    details:               appt.details ?? '',
    next_appointment_date: appt.next_appointment_date ?? '',
  });
  const [errs, setErrs] = useState({});

  const validate = () => {
    const e = {};
    if (!form.date_taken)     e.date_taken = 'Select a date';
    if (!form.type)           e.type       = 'Select appointment type';
    if (!form.details.trim()) e.details    = 'Notes are required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const payload = {
      resident:              form.resident,
      date_taken:            form.date_taken,
      type:                  form.type,
      details:               form.details.trim(),
      next_appointment_date: form.next_appointment_date || null,
    };
    const result = await updateAppointment(appt.id, payload);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Edit Appointment" subtitle="Update appointment details" onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />
        <AppointmentForm form={form} setForm={setForm} errs={errs} residents={residents} isEdit />
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Appointment card ─────────────────────────────────────────────────────────

const AppointmentCard = ({ appt, residentName, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const tc     = typeColor(appt.type);
  const badge  = nextBadge(appt.next_appointment_date);
  const isPast = appt.date_taken < today();

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button type="button"
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

        {/* Date block */}
        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
          style={{ background: isPast ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <p className="text-[10px] font-bold leading-none" style={{ color: '#a78bfa' }}>
            {new Date(appt.date_taken + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short' }).toUpperCase()}
          </p>
          <p className="text-lg font-black text-white leading-none mt-0.5">
            {new Date(appt.date_taken + 'T00:00:00').getDate()}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Resident name */}
            <p className="text-sm font-bold text-white">{residentName}</p>
            {/* Type chip */}
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
              {TYPE_SHORT[appt.type] ?? appt.type}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {fmt(appt.date_taken)}
            </p>
            {/* Next appointment badge */}
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                Next: {badge.label}
              </span>
            )}
          </div>
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {[
              ['Resident',          residentName],
              ['Date',              fmt(appt.date_taken)],
              ['Type',              TYPE_SHORT[appt.type] ?? appt.type],
              ...(appt.next_appointment_date ? [['Next Appointment', fmt(appt.next_appointment_date)]] : []),
              ['Logged',            fmt(appt.created_at?.slice(0, 10))],
            ].map(([l, v]) => (
              <div key={l} className="px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
                <p className="text-xs font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="px-4 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Appointment Notes
            </p>
            <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{appt.details}</p>
          </div>

          {/* Next appointment callout */}
          {appt.next_appointment_date && badge && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: badge.bg, border: `1px solid ${badge.border}` }}>
              <span className="text-lg">📅</span>
              <div>
                <p className="text-xs font-bold" style={{ color: badge.color }}>
                  Follow-up: {fmt(appt.next_appointment_date)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: badge.color + 'aa' }}>{badge.label}</p>
              </div>
            </div>
          )}

          {/* Edit button */}
          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(appt)}>
              ✏️ Edit Appointment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Upcoming reminder strip ──────────────────────────────────────────────────

const UpcomingStrip = ({ appointments, residentMap, onCreateClick }) => {
  const upcoming = useMemo(() =>
    appointments
      .filter(a => a.next_appointment_date && daysUntil(a.next_appointment_date) !== null && daysUntil(a.next_appointment_date) >= 0)
      .sort((a, b) => a.next_appointment_date.localeCompare(b.next_appointment_date))
      .slice(0, 5),
    [appointments]
  );

  if (upcoming.length === 0) return null;

  const urgent = upcoming.filter(a => (daysUntil(a.next_appointment_date) ?? 99) <= 7);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: urgent.length > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-5 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: urgent.length > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)' }}>
        <span>{urgent.length > 0 ? '⚠️' : '📅'}</span>
        <p className="text-sm font-bold" style={{ color: urgent.length > 0 ? '#fbbf24' : '#a78bfa' }}>
          Upcoming Follow-ups
        </p>
        <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {upcoming.length} scheduled
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {upcoming.map(a => {
          const badge = nextBadge(a.next_appointment_date);
          const tc    = typeColor(a.type);
          return (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {residentMap[String(a.resident)] ?? '—'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ background: tc.bg, color: tc.color }}>
                    {TYPE_SHORT[a.type] ?? a.type}
                  </span>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {fmt(a.next_appointment_date)}
                  </p>
                </div>
              </div>
              {badge && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold shrink-0"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {badge.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CaregiverAppointments = () => {
  const [showCreate,   setShowCreate]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [residentFilter, setResidentFilter] = useState('');
  const [search,       setSearch]       = useState('');

  const {
    appointments, loading, error,
    saving, saveError, setSaveError,
    createAppointment, updateAppointment, refetch,
  } = useAppointments();

  const { residents } = useResidents();

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );

  const residentOptions = [
    { value: '', label: 'All Residents' },
    ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
  ];

  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    ...APPOINTMENT_TYPES,
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter(a =>
      (typeFilter     === 'all' || a.type === typeFilter) &&
      (residentFilter === ''    || String(a.resident) === residentFilter) &&
      (!q || residentMap[String(a.resident)]?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q) || a.details?.toLowerCase().includes(q))
    );
  }, [appointments, typeFilter, residentFilter, search, residentMap]);

  return (
    <DashboardLayout pageTitle="Appointments" pageSubtitle="Log and track resident medical appointments">
      <div className="space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Appointment
          </Button>
        </div>

        {/* Upcoming follow-ups strip */}
        {!loading && appointments.length > 0 && (
          <UpcomingStrip
            appointments={appointments}
            residentMap={residentMap}
            onCreateClick={() => setShowCreate(true)}
          />
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by resident, type, or notes…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              onFocus={e => { e.target.style.border='1px solid rgba(124,58,237,0.5)'; e.target.style.background='rgba(124,58,237,0.06)'; }}
              onBlur={e => { e.target.style.border='1px solid rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
            )}
          </div>

          {/* Resident + type dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <DarkSelect label="" value={residentFilter}
              onChange={e => setResidentFilter(e.target.value)}
              options={residentOptions} />
            <DarkSelect label="" value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={typeFilterOptions} />
          </div>
        </div>

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
            {(residentFilter || typeFilter !== 'all' || search) ? ' · filtered' : ''}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
          </div>
        )}
        {!loading && error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}

        {/* Empty states */}
        {!loading && !error && appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-5xl">📅</span>
            <div>
              <p className="text-base font-black text-white mb-2">No appointments logged yet</p>
              <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Log resident appointments including the provider seen, outcomes, and any scheduled follow-ups.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              Log First Appointment
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && appointments.length > 0 && (
          <div className="text-center py-10 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/50 text-sm">No appointments match your filters.</p>
          </div>
        )}

        {/* List */}
        {!loading && filtered.map(appt => (
          <AppointmentCard
            key={appt.id}
            appt={appt}
            residentName={residentMap[String(appt.resident)] ?? '—'}
            onEdit={setEditTarget}
          />
        ))}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          residents={residents}
          onClose={() => { setShowCreate(false); setSaveError(null); }}
          onSuccess={() => { setShowCreate(false); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          createAppointment={createAppointment}
        />
      )}
      {editTarget && (
        <EditModal
          appt={editTarget}
          residents={residents}
          onClose={() => { setEditTarget(null); setSaveError(null); }}
          onSuccess={() => { setEditTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          updateAppointment={updateAppointment}
        />
      )}
    </DashboardLayout>
  );
};

export default CaregiverAppointments;