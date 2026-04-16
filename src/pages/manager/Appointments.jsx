import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useAppointments from '../../hooks/useAppointments';
import useResidents from '../../hooks/useResidents';
import {
  DarkInput,
  DarkSelect,
  ModalShell,
  ErrorBanner,
  UnsavedBadge,
} from '../../components/ui/FormComponents';

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

// Short display labels for chips / badges
const TYPE_SHORT = {
  'Primary Care Provider (PCP)':                       'PCP',
  'Mental Health Provider / Physician/ Prescriber':    'Mental Health',
  'Clinician':                                         'Clinician',
  'Peer Support Counsellor':                           'Peer Support',
  'Counsellor':                                        'Counsellor',
  'Dentist':                                           'Dentist',
  'Specialist':                                        'Specialist',
  'Other':                                             'Other',
};

// Colour per type (cycles through palette)
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

const typeColor = type => TYPE_COLORS[APPOINTMENT_TYPES.findIndex(t => t.value === type) % TYPE_COLORS.length] ?? TYPE_COLORS[7];

// ─── date helpers ─────────────────────────────────────────────────────────────

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const daysUntil = iso => {
  if (!iso) return null;
  const diff = new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
};

const nextStatus = iso => {
  const d = daysUntil(iso);
  if (d === null) return null;
  if (d < 0)       return { label: `${Math.abs(d)}d overdue`,    color: '#f87171', glow: 'rgba(239,68,68,0.4)'   };
  if (d === 0)     return { label: 'Today!',                     color: '#fbbf24', glow: 'rgba(245,158,11,0.4)'  };
  if (d === 1)     return { label: 'Tomorrow',                   color: '#fbbf24', glow: 'rgba(245,158,11,0.3)'  };
  if (d <= 14)     return { label: `${d}d away`,                 color: '#fbbf24', glow: 'rgba(245,158,11,0.25)' };
  if (d <= 60)     return { label: `${d}d away`,                 color: '#60a5fa', glow: 'rgba(59,130,246,0.2)'  };
  return             { label: `${d}d away`,                      color: '#34d399', glow: 'rgba(16,185,129,0.2)'  };
};

// ─── shared sub-components ────────────────────────────────────────────────────

const SectionLabel = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    <span className="text-base">{icon}</span>
    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

const DarkTextarea = ({ label, error, rows = 3, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</label>}
    <textarea
      rows={rows}
      className="w-full text-sm rounded-xl px-4 py-3 transition-all duration-200 focus:outline-none resize-none"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
        color: '#fff', colorScheme: 'dark',
      }}
      onFocus={e => { if (!error) e.target.style.border = '1px solid rgba(124,58,237,0.55)'; e.target.style.background = 'rgba(124,58,237,0.07)'; }}
      onBlur={e => { e.target.style.border = error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.07)'; }}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const TypeBadge = ({ type }) => {
  const c = typeColor(type);
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {TYPE_SHORT[type] ?? type}
    </span>
  );
};

// ─── AppointmentForm ──────────────────────────────────────────────────────────

const EMPTY = { resident: '', type: '', date_taken: '', details: '', next_appointment_date: '' };

const AppointmentForm = ({
  form, onChange, fieldErrors,
  saveError, setSaveError,
  residentOptions, saving,
  onSubmit, onCancel, submitLabel, hasChanges,
}) => {
  const set = key => e => { onChange(key, e.target.value); if (saveError) setSaveError(null); };

  return (
    <div className="space-y-4">
      <ErrorBanner message={saveError} />

      <DarkSelect
        label="Resident *"
        value={form.resident}
        onChange={set('resident')}
        options={residentOptions}
        placeholder="Select resident…"
        error={fieldErrors.resident}
      />

      <DarkSelect
        label="Appointment Type *"
        value={form.type}
        onChange={set('type')}
        options={APPOINTMENT_TYPES}
        placeholder="Select type…"
        error={fieldErrors.type}
      />

      {/* Live type preview */}
      {form.type && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Selected:</span>
          <TypeBadge type={form.type} />
        </div>
      )}

      <SectionLabel icon="📅" title="Dates" />
      <div className="grid grid-cols-2 gap-3">
        <DarkInput
          label="Date Taken *"
          type="date"
          value={form.date_taken}
          onChange={set('date_taken')}
          error={fieldErrors.date_taken}
        />
        <DarkInput
          label="Next Appointment"
          type="date"
          value={form.next_appointment_date}
          onChange={set('next_appointment_date')}
        />
      </div>

      <SectionLabel icon="📝" title="Details" />
      <DarkTextarea
        label="Appointment Details *"
        placeholder="Notes, outcomes, instructions, follow-ups…"
        value={form.details}
        onChange={set('details')}
        error={fieldErrors.details}
        rows={4}
      />

      <UnsavedBadge visible={hasChanges === true} />

      <div className="flex gap-3 pt-1">
        <Button variant="outline" size="md" fullWidth onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="md" fullWidth loading={saving}
          disabled={saving || (hasChanges === false)} onClick={onSubmit}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  );
};

const validateForm = f => {
  const e = {};
  if (!f.resident)         e.resident   = 'Select a resident';
  if (!f.type)             e.type       = 'Select a type';
  if (!f.date_taken)       e.date_taken = 'Date is required';
  if (!f.details?.trim())  e.details    = 'Details are required';
  return e;
};

// ─── CreateAppointmentModal ───────────────────────────────────────────────────

const CreateAppointmentModal = ({ onClose, onSuccess, saving, saveError, setSaveError, createAppointment, residentOptions }) => {
  const [form, setForm]           = useState({ ...EMPTY });
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    const result = await createAppointment({
      resident:   form.resident,
      type:       form.type,
      date_taken: form.date_taken,
      details:    form.details.trim(),
      ...(form.next_appointment_date && { next_appointment_date: form.next_appointment_date }),
    });
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="New Appointment" subtitle="Record an appointment for a resident" onClose={onClose}>
      <AppointmentForm
        form={form} onChange={onChange} fieldErrors={fieldErrors}
        saveError={saveError} setSaveError={setSaveError}
        residentOptions={residentOptions} saving={saving}
        onSubmit={handleSubmit} onCancel={onClose}
        submitLabel="Create Appointment" hasChanges={undefined}
      />
    </ModalShell>
  );
};

// ─── EditAppointmentPanel (slide-over) ───────────────────────────────────────

const EditAppointmentPanel = ({ appt, residentName, onClose, onSuccess, saving, saveError, setSaveError, updateAppointment, residentOptions }) => {
  const orig = {
    resident:              String(appt.resident ?? appt.resident?.id ?? ''),
    type:                  appt.type            ?? '',
    date_taken:            appt.date_taken       ?? '',
    details:               appt.details          ?? '',
    next_appointment_date: appt.next_appointment_date ?? '',
  };
  const [form, setForm]               = useState({ ...orig });
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
  };

  const hasChanges = Object.keys(form).some(k => form[k] !== orig[k]);

  const handleSubmit = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    if (!hasChanges) { onClose(); return; }
    const payload = {};
    Object.keys(form).forEach(k => { if (form[k] !== orig[k]) payload[k] = form[k] || null; });
    if (payload.details   === null) delete payload.details;
    if (payload.type      === null) delete payload.type;
    if (payload.date_taken === null) delete payload.date_taken;
    const result = await updateAppointment(appt.id, payload);
    if (result.success) onSuccess();
  };

  const ns = nextStatus(appt.next_appointment_date);

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-125 flex flex-col"
        style={{ background: '#130d2e', borderLeft: '1px solid rgba(124,58,237,0.25)', boxShadow: '-24px 0 64px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-base font-black text-white">Edit Appointment</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{residentName}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <TypeBadge type={appt.type} />
              {ns && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: ns.color, border: `1px solid ${ns.color}40` }}>
                  Next: {ns.label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all mt-0.5 shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          <AppointmentForm
            form={form} onChange={onChange} fieldErrors={fieldErrors}
            saveError={saveError} setSaveError={setSaveError}
            residentOptions={residentOptions} saving={saving}
            onSubmit={handleSubmit} onCancel={onClose}
            submitLabel="Save Changes" hasChanges={hasChanges}
          />
        </div>
      </div>
    </>
  );
};

// ─── AppointmentCard ──────────────────────────────────────────────────────────

const AppointmentCard = ({ appt, residentName, onEdit }) => {
  const c  = typeColor(appt.type);
  const ns = nextStatus(appt.next_appointment_date);

  return (
    <div
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-250 flex flex-col gap-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onClick={() => onEdit(appt)}
      onMouseEnter={e => {
        e.currentTarget.style.background = c.bg;
        e.currentTarget.style.border     = `1px solid ${c.border}`;
        e.currentTarget.style.transform  = 'translateY(-3px)';
        e.currentTarget.style.boxShadow  = `0 16px 40px ${c.bg.replace('0.15','0.2')}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.border     = '1px solid rgba(255,255,255,0.07)';
        e.currentTarget.style.transform  = 'translateY(0)';
        e.currentTarget.style.boxShadow  = 'none';
      }}
    >
      {/* Top stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg,${c.color},${c.color}60)` }} />

      {/* Type badge + resident */}
      <div className="flex items-start justify-between gap-2">
        <TypeBadge type={appt.type} />
        <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: c.color }}>Edit →</span>
      </div>

      <div>
        <p className="text-sm font-black text-white">{residentName}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Taken: {fmt(appt.date_taken)}
        </p>
      </div>

      {/* Details snippet */}
      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {appt.details}
      </p>

      {/* Next appointment */}
      {appt.next_appointment_date && ns && (
        <div className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Next Appointment
            </p>
            <p className="text-xs font-semibold text-white">{fmt(appt.next_appointment_date)}</p>
          </div>
          <span className="text-xs font-black" style={{ color: ns.color }}>{ns.label}</span>
        </div>
      )}

      {!appt.next_appointment_date && (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No follow-up scheduled</p>
      )}
    </div>
  );
};

// ─── AppointmentRow (table) ───────────────────────────────────────────────────

const AppointmentRow = ({ appt, residentName, index, onEdit }) => {
  const c  = typeColor(appt.type);
  const ns = nextStatus(appt.next_appointment_date);

  return (
    <div
      className="grid grid-cols-12 gap-3 px-5 py-3.5 cursor-pointer transition-all duration-150 items-center"
      style={{ borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
      onClick={() => onEdit(appt)}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div className="col-span-3 min-w-0">
        <p className="text-sm font-bold text-white truncate">{residentName}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{fmt(appt.date_taken)}</p>
      </div>
      <div className="col-span-2"><TypeBadge type={appt.type} /></div>
      <div className="col-span-4">
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{appt.details}</p>
      </div>
      <div className="col-span-2">
        {appt.next_appointment_date
          ? <div>
              <p className="text-xs text-white">{fmt(appt.next_appointment_date)}</p>
              {ns && <p className="text-[11px] font-bold" style={{ color: ns.color }}>{ns.label}</p>}
            </div>
          : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
        }
      </div>
      <div className="col-span-1 flex justify-end">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.2)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

// ─── Main Appointments page ───────────────────────────────────────────────────

const Appointments = () => {
  const {
    appointments, loading, error,
    saving, saveError, setSaveError,
    createAppointment, updateAppointment, refetch,
  } = useAppointments();

  const { residents } = useResidents();

  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [timeFilter, setTimeFilter]     = useState('all'); // all | upcoming | overdue | no-followup
  const [view, setView]                 = useState('cards');

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );

  const residentOptions = useMemo(() =>
    residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
    [residents]
  );

  const getName = a =>
    residentMap[String(a.resident)] ||
    residentMap[String(a.resident?.id)] ||
    'Unknown';

  // Enrich
  const enriched = useMemo(() =>
    appointments.map(a => ({ ...a, _name: getName(a) })),
    [appointments, residentMap]
  );

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enriched.filter(a => {
      const matchSearch = !q ||
        a._name.toLowerCase().includes(q)  ||
        a.type?.toLowerCase().includes(q)  ||
        a.details?.toLowerCase().includes(q);

      const matchType = typeFilter === 'all' || a.type === typeFilter;

      const d = daysUntil(a.next_appointment_date);
      const matchTime =
        timeFilter === 'all'         ||
        (timeFilter === 'overdue'    && d !== null && d < 0)    ||
        (timeFilter === 'upcoming'   && d !== null && d >= 0 && d <= 30) ||
        (timeFilter === 'no-followup' && !a.next_appointment_date);

      return matchSearch && matchType && matchTime;
    });
  }, [enriched, search, typeFilter, timeFilter]);

  // Sort: overdue first, then soonest next appointment, then rest
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const da = daysUntil(a.next_appointment_date) ?? 9999;
    const db = daysUntil(b.next_appointment_date) ?? 9999;
    return da - db;
  }), [filtered]);

  // Counts for summary
  const counts = useMemo(() => ({
    total:      appointments.length,
    overdue:    enriched.filter(a => { const d = daysUntil(a.next_appointment_date); return d !== null && d < 0; }).length,
    upcoming:   enriched.filter(a => { const d = daysUntil(a.next_appointment_date); return d !== null && d >= 0 && d <= 30; }).length,
    noFollowUp: enriched.filter(a => !a.next_appointment_date).length,
  }), [enriched, appointments]);

  // Unique types present in data for filter chips
  const presentTypes = useMemo(() =>
    [...new Set(appointments.map(a => a.type).filter(Boolean))],
    [appointments]
  );

  const closeCreate = () => { setShowCreate(false); setSaveError(null); };
  const closeEdit   = () => { setEditTarget(null);  setSaveError(null); };

  return (
    <DashboardLayout pageTitle="Appointments" pageSubtitle="Track and manage resident appointments">
      <div className="space-y-5 animate-slide-up">

        {/* ── Summary stats ── */}
        {!loading && appointments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',        value: counts.total,      gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.25)', filter: 'all'        },
              { label: 'Overdue',      value: counts.overdue,    gradient: 'linear-gradient(90deg,#ef4444,#f97316)', glow: 'rgba(239,68,68,0.3)',   filter: 'overdue',   alert: counts.overdue > 0 },
              { label: 'Due in 30d',   value: counts.upcoming,   gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,0.3)',  filter: 'upcoming',  alert: counts.upcoming > 0 },
              { label: 'No Follow-up', value: counts.noFollowUp, gradient: 'linear-gradient(90deg,#64748b,#94a3b8)', glow: 'rgba(100,116,139,0.2)', filter: 'no-followup' },
            ].map(s => (
              <div key={s.label}
                className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: s.alert ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setTimeFilter(s.filter)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${s.glow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.gradient }} />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-black text-white">{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                  </div>
                  {s.alert && <span className="animate-pulse text-base">⚠️</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search by resident, type or notes…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
              {search && <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {[
                { id: 'cards', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
                { id: 'table', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)} className="px-3 py-2.5 transition-all"
                  style={view === v.id ? { background: 'rgba(124,58,237,0.3)', color: '#c4b5fd' } : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }}>
                  {v.icon}
                </button>
              ))}
            </div>

            <Button variant="primary" size="md" onClick={() => setShowCreate(true)} className="shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Appointment</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {/* Filter row 2: time + type */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* Time filters */}
            {[
              { id: 'all',         label: 'All' },
              { id: 'overdue',     label: '⚠ Overdue' },
              { id: 'upcoming',    label: '📅 Due Soon' },
              { id: 'no-followup', label: '○ No Follow-up' },
            ].map(f => (
              <button key={f.id} onClick={() => setTimeFilter(f.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={timeFilter === f.id ? {
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                }}>
                {f.label}
              </button>
            ))}

            {/* Divider */}
            {presentTypes.length > 0 && <div className="w-px h-5 shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />}

            {/* Type filters — only show types that exist in the data */}
            {presentTypes.length > 0 && (
              <>
                <button onClick={() => setTypeFilter('all')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={typeFilter === 'all' ? {
                    background: 'rgba(6,182,212,0.2)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.35)',
                  } : {
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                  }}>
                  All Types
                </button>
                {presentTypes.map(t => {
                  const c = typeColor(t);
                  return (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={typeFilter === t ? {
                        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                      } : {
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                      }}>
                      {TYPE_SHORT[t] ?? t}
                    </button>
                  );
                })}
              </>
            )}

            <span className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              {sorted.length} shown
            </span>
          </div>
        </div>

        {/* ── States ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading appointments…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-5xl">⚠️</div>
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <Button variant="ghost" size="sm" onClick={refetch}>Try Again</Button>
          </div>
        )}

        {!loading && !error && appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>📅</div>
            <div>
              <p className="text-base font-bold text-white mb-1">No appointments yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Record the first resident appointment to begin tracking</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>Add First Appointment</Button>
          </div>
        )}

        {!loading && !error && appointments.length > 0 && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-semibold text-white">No appointments match your filters</p>
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setTimeFilter('all'); }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Clear all filters</button>
          </div>
        )}

        {/* ── Cards ── */}
        {!loading && !error && sorted.length > 0 && view === 'cards' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(a => (
              <AppointmentCard key={a.id} appt={a} residentName={a._name} onEdit={setEditTarget} />
            ))}
          </div>
        )}

        {/* ── Table ── */}
        {!loading && !error && sorted.length > 0 && view === 'table' && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="col-span-3">Resident</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-4">Details</div>
              <div className="col-span-2">Next Appt</div>
              <div className="col-span-1" />
            </div>
            {sorted.map((a, i) => (
              <AppointmentRow key={a.id} appt={a} residentName={a._name} index={i} onEdit={setEditTarget} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateAppointmentModal
          onClose={closeCreate}
          onSuccess={() => { setShowCreate(false); setSaveError(null); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          createAppointment={createAppointment} residentOptions={residentOptions}
        />
      )}

      {editTarget && (
        <EditAppointmentPanel
          appt={editTarget}
          residentName={getName(editTarget)}
          onClose={closeEdit}
          onSuccess={() => { setEditTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          updateAppointment={updateAppointment} residentOptions={residentOptions}
        />
      )}
    </DashboardLayout>
  );
};

export default Appointments;