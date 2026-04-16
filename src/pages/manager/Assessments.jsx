import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useAssessments from '../../hooks/useAssessments';
import useResidents from '../../hooks/useResidents';
import {
  DarkInput,
  DarkSelect,
  ModalShell,
  ErrorBanner,
  UnsavedBadge,
} from '../../components/ui/FormComponents';

// ─── date helpers ─────────────────────────────────────────────────────────────

const fmt = iso =>
  iso
    ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const daysUntil = iso => {
  if (!iso) return null;
  const diff = new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const isOverdue  = iso => { const d = daysUntil(iso); return d !== null && d < 0; };
const isDueSoon  = iso => { const d = daysUntil(iso); return d !== null && d >= 0 && d <= 14; };
const isUpcoming = iso => { const d = daysUntil(iso); return d !== null && d > 14 && d <= 60; };

/**
 * Returns the most urgent date status for an assessment row.
 * Priority: overdue > due-soon > upcoming > ok
 */
const rowStatus = a => {
  const dates = [a.assessment_next_date, a.ncp_next_date].filter(Boolean);
  if (dates.some(isOverdue))  return 'overdue';
  if (dates.some(isDueSoon))  return 'due-soon';
  if (dates.some(isUpcoming)) return 'upcoming';
  return 'ok';
};

const STATUS_META = {
  overdue:  { label: 'Overdue',   color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   dot: '#ef4444' },
  'due-soon':{ label: 'Due Soon', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  upcoming: { label: 'Upcoming',  color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)', dot: '#3b82f6' },
  ok:       { label: 'On Track',  color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
};

// ─── DateCountdown chip ───────────────────────────────────────────────────────

const DateChip = ({ iso, label }) => {
  if (!iso) return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Not set</p>
    </div>
  );

  const days = daysUntil(iso);
  let countdownStyle = { color: '#34d399' };
  if (days < 0)       countdownStyle = { color: '#f87171' };
  else if (days <= 14) countdownStyle = { color: '#fbbf24' };
  else if (days <= 60) countdownStyle = { color: '#60a5fa' };

  const countdownText =
    days < 0  ? `${Math.abs(days)}d overdue` :
    days === 0 ? 'Today!'                     :
    days === 1 ? 'Tomorrow'                   :
                 `${days}d away`;

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
      <p className="text-xs font-semibold text-white/80">{fmt(iso)}</p>
      <p className="text-[11px] font-bold" style={countdownStyle}>{countdownText}</p>
    </div>
  );
};

// ─── SectionLabel (reused from Residents) ────────────────────────────────────

const SectionLabel = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    <span className="text-base">{icon}</span>
    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
      {title}
    </span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

// ─── EMPTY form ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  resident:                '',
  assessment_start_date:   '',
  assessment_next_date:    '',
  ncp_start_date:          '',
  ncp_next_date:           '',
  social_worker:           '',
};

// ─── AssessmentForm — shared between create and edit ─────────────────────────

const AssessmentForm = ({
  form, onChange, fieldErrors,
  saveError, setSaveError,
  residentOptions, saving,
  onSubmit, onCancel, submitLabel,
  hasChanges, isEdit,
}) => {
  const set = key => e => {
    onChange(key, e.target.value);
    if (saveError) setSaveError(null);
  };

  return (
    <div className="space-y-5">
      <ErrorBanner message={saveError} />

      {/* Resident */}
      <DarkSelect
        label="Resident *"
        value={form.resident}
        onChange={set('resident')}
        options={residentOptions}
        placeholder={residentOptions.length === 0 ? 'No residents found' : 'Select resident…'}
        error={fieldErrors.resident}
        hint="The resident this assessment belongs to"
      />

      {/* Social Worker */}
      <DarkInput
        label="Social Worker *"
        placeholder="e.g. Mary Wanjiru"
        value={form.social_worker}
        onChange={set('social_worker')}
        error={fieldErrors.social_worker}
      />

      {/* Assessment dates */}
      <SectionLabel icon="📋" title="Assessment Dates" />
      <div className="grid grid-cols-2 gap-3">
        <DarkInput
          label="Assessment Start Date"
          type="date"
          value={form.assessment_start_date}
          onChange={set('assessment_start_date')}
          error={fieldErrors.assessment_start_date}
        />
        <DarkInput
          label="Assessment Next Date"
          type="date"
          value={form.assessment_next_date}
          onChange={set('assessment_next_date')}
          error={fieldErrors.assessment_next_date}
          hint="When the next assessment is due"
        />
      </div>

      {/* NCP dates */}
      <SectionLabel icon="🗂️" title="Nursing Care Plan (NCP) Dates" />
      <div className="grid grid-cols-2 gap-3">
        <DarkInput
          label="NCP Start Date"
          type="date"
          value={form.ncp_start_date}
          onChange={set('ncp_start_date')}
        />
        <DarkInput
          label="NCP Next Date"
          type="date"
          value={form.ncp_next_date}
          onChange={set('ncp_next_date')}
          hint="When the NCP is next due for review"
        />
      </div>

      <UnsavedBadge visible={hasChanges === true} />

      <div className="flex gap-3 pt-1">
        <Button variant="outline" size="md" fullWidth onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary" size="md" fullWidth
          loading={saving}
          disabled={saving || (hasChanges === false)}
          onClick={onSubmit}
        >
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  );
};

// ─── validate ─────────────────────────────────────────────────────────────────

const validate = form => {
  const e = {};
  if (!form.resident)            e.resident      = 'Please select a resident';
  if (!form.social_worker.trim()) e.social_worker = 'Social worker name is required';
  return e;
};

// ─── CreateAssessmentModal ────────────────────────────────────────────────────

const CreateAssessmentModal = ({
  onClose, onSuccess,
  saving, saveError, setSaveError,
  createAssessment, residentOptions,
}) => {
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    const payload = {
      resident:      form.resident,
      social_worker: form.social_worker.trim(),
      ...(form.assessment_start_date && { assessment_start_date: form.assessment_start_date }),
      ...(form.assessment_next_date  && { assessment_next_date:  form.assessment_next_date  }),
      ...(form.ncp_start_date        && { ncp_start_date:        form.ncp_start_date        }),
      ...(form.ncp_next_date         && { ncp_next_date:         form.ncp_next_date         }),
    };

    const result = await createAssessment(payload);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell
      title="New Assessment"
      subtitle="Schedule a new assessment for a resident"
      onClose={onClose}
    >
      <AssessmentForm
        form={form} onChange={onChange}
        fieldErrors={fieldErrors}
        saveError={saveError} setSaveError={setSaveError}
        residentOptions={residentOptions}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Create Assessment"
        hasChanges={undefined}
      />
    </ModalShell>
  );
};

// ─── EditAssessmentPanel (slide-over) ────────────────────────────────────────

const EditAssessmentPanel = ({
  assessment, residentName,
  onClose, onSuccess,
  saving, saveError, setSaveError,
  updateAssessment, residentOptions,
}) => {
  const [form, setForm] = useState({
    resident:              String(assessment.resident ?? assessment.resident_id ?? ''),
    assessment_start_date: assessment.assessment_start_date ?? '',
    assessment_next_date:  assessment.assessment_next_date  ?? '',
    ncp_start_date:        assessment.ncp_start_date        ?? '',
    ncp_next_date:         assessment.ncp_next_date         ?? '',
    social_worker:         assessment.social_worker         ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
  };

  const orig = {
    resident:              String(assessment.resident ?? assessment.resident_id ?? ''),
    assessment_start_date: assessment.assessment_start_date ?? '',
    assessment_next_date:  assessment.assessment_next_date  ?? '',
    ncp_start_date:        assessment.ncp_start_date        ?? '',
    ncp_next_date:         assessment.ncp_next_date         ?? '',
    social_worker:         assessment.social_worker         ?? '',
  };

  const hasChanges = Object.keys(form).some(k => form[k] !== orig[k]);

  const handleSubmit = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    if (!hasChanges) { onClose(); return; }

    const payload = {};
    Object.keys(form).forEach(k => {
      if (form[k] !== orig[k]) payload[k] = form[k] || null;
    });
    // social_worker must be a string
    if (payload.social_worker === null) delete payload.social_worker;

    const result = await updateAssessment(assessment.id, payload);
    if (result.success) onSuccess();
  };

  const status = rowStatus(assessment);
  const meta   = STATUS_META[status];

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-125 flex flex-col"
        style={{
          background: '#130d2e',
          borderLeft: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-base font-black text-white">Edit Assessment</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {residentName}
            </p>
            {/* Status badge */}
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
              {meta.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all mt-0.5"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          <AssessmentForm
            form={form} onChange={onChange}
            fieldErrors={fieldErrors}
            saveError={saveError} setSaveError={setSaveError}
            residentOptions={residentOptions}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Save Changes"
            hasChanges={hasChanges}
            isEdit
          />
        </div>
      </div>
    </>
  );
};

// ─── AssessmentRow ────────────────────────────────────────────────────────────

const AssessmentRow = ({ assessment, residentName, index, onEdit }) => {
  const status = rowStatus(assessment);
  const meta   = STATUS_META[status];

  return (
    <div
      className="grid grid-cols-12 gap-3 px-5 py-4 cursor-pointer transition-all duration-150 items-center"
      style={{ borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
      onClick={() => onEdit(assessment)}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Resident */}
      <div className="col-span-3 min-w-0">
        <p className="text-sm font-bold text-white truncate">{residentName}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {assessment.social_worker || '—'}
        </p>
      </div>

      {/* Assessment dates */}
      <div className="col-span-3">
        <DateChip iso={assessment.assessment_next_date} label="Assessment Next" />
      </div>

      {/* NCP dates */}
      <div className="col-span-3">
        <DateChip iso={assessment.ncp_next_date} label="NCP Next" />
      </div>

      {/* Created */}
      <div className="col-span-2">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {fmt(assessment.created_at)}
        </p>
      </div>

      {/* Status */}
      <div className="col-span-1 flex justify-end">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
        >
          {meta.label}
        </span>
      </div>
    </div>
  );
};

// ─── TrackingCard — the "at a glance" summary card per assessment ─────────────

const TrackingCard = ({ assessment, residentName, onEdit }) => {
  const status = rowStatus(assessment);
  const meta   = STATUS_META[status];

  const assessDays = daysUntil(assessment.assessment_next_date);
  const ncpDays    = daysUntil(assessment.ncp_next_date);

  const barPercent = (days, window = 90) => {
    if (days === null) return 0;
    if (days <= 0)     return 100;
    return Math.max(0, Math.min(100, ((window - days) / window) * 100));
  };

  const barColor = days => {
    if (days === null) return 'rgba(255,255,255,0.1)';
    if (days < 0)      return '#ef4444';
    if (days <= 14)    return '#f59e0b';
    if (days <= 60)    return '#3b82f6';
    return '#10b981';
  };

  return (
    <div
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-250"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${meta.border}` }}
      onClick={() => onEdit(assessment)}
      onMouseEnter={e => {
        e.currentTarget.style.background  = meta.bg;
        e.currentTarget.style.transform   = 'translateY(-3px)';
        e.currentTarget.style.boxShadow   = `0 16px 40px ${meta.dot}30`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Top stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${meta.dot}, ${meta.dot}60)` }} />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-black text-white leading-tight">{residentName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            SW: {assessment.social_worker || '—'}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ml-2"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
          {meta.label}
        </span>
      </div>

      {/* Progress bars for both date types */}
      <div className="space-y-3">
        {/* Assessment */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.35)' }}>Assessment</span>
            <span className="text-[11px] font-bold" style={{ color: barColor(assessDays) }}>
              {assessment.assessment_next_date
                ? assessDays < 0 ? `${Math.abs(assessDays)}d overdue`
                : assessDays === 0 ? 'Today' : `${assessDays}d`
                : 'Not set'}
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${barPercent(assessDays)}%`,
                background: barColor(assessDays),
                boxShadow: assessment.assessment_next_date ? `0 0 6px ${barColor(assessDays)}80` : 'none',
              }} />
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {fmt(assessment.assessment_next_date)}
          </p>
        </div>

        {/* NCP */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.35)' }}>NCP Review</span>
            <span className="text-[11px] font-bold" style={{ color: barColor(ncpDays) }}>
              {assessment.ncp_next_date
                ? ncpDays < 0 ? `${Math.abs(ncpDays)}d overdue`
                : ncpDays === 0 ? 'Today' : `${ncpDays}d`
                : 'Not set'}
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${barPercent(ncpDays)}%`,
                background: barColor(ncpDays),
                boxShadow: assessment.ncp_next_date ? `0 0 6px ${barColor(ncpDays)}80` : 'none',
              }} />
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {fmt(assessment.ncp_next_date)}
          </p>
        </div>
      </div>

      {/* Started */}
      {assessment.assessment_start_date && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Started {fmt(assessment.assessment_start_date)}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Assessments page ────────────────────────────────────────────────────

const FILTER_STATUS = ['all', 'overdue', 'due-soon', 'upcoming', 'ok'];

const Assessments = () => {
  const {
    assessments, loading, error,
    saving, saveError, setSaveError,
    createAssessment, updateAssessment, refetch,
  } = useAssessments();

  const { residents } = useResidents();

  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView]                 = useState('cards'); // 'cards' | 'table'

  // Build resident name lookup and select options
  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [
      String(r.id),
      `${r.first_name} ${r.last_name}`,
    ])),
    [residents]
  );

  const residentOptions = useMemo(() =>
    residents.map(r => ({
      value: String(r.id),
      label: `${r.first_name} ${r.last_name}`,
    })),
    [residents]
  );

  const residentName = a =>
    residentMap[String(a.resident)] ||
    residentMap[String(a.resident?.id)] ||
    'Unknown Resident';

  // Enrich + filter
  const enriched = useMemo(() =>
    assessments.map(a => ({ ...a, _status: rowStatus(a), _name: residentName(a) })),
    [assessments, residentMap]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enriched.filter(a => {
      const matchSearch = !q ||
        a._name.toLowerCase().includes(q) ||
        a.social_worker?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || a._status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [enriched, search, statusFilter]);

  // Sort: overdue first, then due-soon, then upcoming, then ok
  const ORDER = { overdue: 0, 'due-soon': 1, upcoming: 2, ok: 3 };
  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => (ORDER[a._status] ?? 4) - (ORDER[b._status] ?? 4)),
    [filtered]
  );

  // Summary counts
  const counts = useMemo(() => ({
    total:    assessments.length,
    overdue:  enriched.filter(a => a._status === 'overdue').length,
    dueSoon:  enriched.filter(a => a._status === 'due-soon').length,
    upcoming: enriched.filter(a => a._status === 'upcoming').length,
    onTrack:  enriched.filter(a => a._status === 'ok').length,
  }), [enriched, assessments]);

  const closeCreate = () => { setShowCreate(false); setSaveError(null); };
  const closeEdit   = () => { setEditTarget(null);  setSaveError(null); };

  // Target resident name for edit panel header
  const editResidentName = editTarget ? residentName(editTarget) : '';

  return (
    <DashboardLayout pageTitle="Assessments" pageSubtitle="Schedule and track resident assessments & NCP reviews">
      <div className="space-y-5 animate-slide-up">

        {/* ── Tracking summary cards ── */}
        {!loading && assessments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',     value: counts.total,    gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.25)' },
              { label: 'Overdue',   value: counts.overdue,  gradient: 'linear-gradient(90deg,#ef4444,#f97316)', glow: 'rgba(239,68,68,0.3)',  alert: counts.overdue  > 0 },
              { label: 'Due Soon',  value: counts.dueSoon,  gradient: 'linear-gradient(90deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,0.3)', alert: counts.dueSoon  > 0 },
              { label: 'On Track',  value: counts.onTrack,  gradient: 'linear-gradient(90deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.25)' },
            ].map(s => (
              <div key={s.label}
                className="relative rounded-2xl p-4 overflow-hidden transition-all duration-200 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: s.alert ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={() => setStatusFilter(s.label.toLowerCase().replace(' ', '-') === 'total' ? 'all' : s.label.toLowerCase().replace(' ', '-'))}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${s.glow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.gradient }} />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-black text-white">{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                  </div>
                  {s.alert && (
                    <span className="text-base animate-pulse">⚠️</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3">
          {/* Row 1 */}
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by resident or social worker…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {[
                { id: 'cards', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
                { id: 'table', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className="px-3 py-2.5 transition-all"
                  style={view === v.id
                    ? { background: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.35)' }
                  }>
                  {v.icon}
                </button>
              ))}
            </div>

            <Button variant="primary" size="md" onClick={() => setShowCreate(true)} className="shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Assessment</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {/* Row 2: status filter pills */}
          <div className="flex gap-2 flex-wrap items-center">
            {FILTER_STATUS.map(f => {
              const meta = f === 'all' ? null : STATUS_META[f];
              const isActive = statusFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize flex items-center gap-1.5"
                  style={isActive ? {
                    background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color: meta ? meta.color : '#fff',
                    border: `1px solid ${meta ? meta.border : 'transparent'}`,
                    boxShadow: '0 4px 12px rgba(124,58,237,0.2)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {meta && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? meta.dot : 'rgba(255,255,255,0.3)' }} />}
                  {f === 'all' ? 'All' : meta.label}
                  {/* Count badge */}
                  {f !== 'all' && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.2)' }}>
                      {enriched.filter(a => a._status === f).length}
                    </span>
                  )}
                </button>
              );
            })}

            <span className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              {sorted.length} shown
            </span>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-2xl animate-pulse"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Loading assessments…
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-5xl">⚠️</div>
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <Button variant="ghost" size="sm" onClick={refetch}>Try Again</Button>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && assessments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>
              📋
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">No assessments yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Schedule the first resident assessment to begin tracking
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              Schedule First Assessment
            </Button>
          </div>
        )}

        {/* ── No results ── */}
        {!loading && !error && assessments.length > 0 && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-semibold text-white">No assessments match your filters</p>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Cards view ── */}
        {!loading && !error && sorted.length > 0 && view === 'cards' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(a => (
              <TrackingCard
                key={a.id}
                assessment={a}
                residentName={a._name}
                onEdit={setEditTarget}
              />
            ))}
          </div>
        )}

        {/* ── Table view ── */}
        {!loading && !error && sorted.length > 0 && view === 'table' && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="col-span-3">Resident / SW</div>
              <div className="col-span-3">Assessment Next</div>
              <div className="col-span-3">NCP Next</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-1 text-right">Status</div>
            </div>
            {sorted.map((a, i) => (
              <AssessmentRow
                key={a.id}
                assessment={a}
                residentName={a._name}
                index={i}
                onEdit={setEditTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateAssessmentModal
          onClose={closeCreate}
          onSuccess={() => { setShowCreate(false); setSaveError(null); }}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          createAssessment={createAssessment}
          residentOptions={residentOptions}
        />
      )}

      {/* ── Edit slide-over ── */}
      {editTarget && (
        <EditAssessmentPanel
          assessment={editTarget}
          residentName={editResidentName}
          onClose={closeEdit}
          onSuccess={() => { setEditTarget(null); setSaveError(null); refetch(); }}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          updateAssessment={updateAssessment}
          residentOptions={residentOptions}
        />
      )}
    </DashboardLayout>
  );
};

export default Assessments;