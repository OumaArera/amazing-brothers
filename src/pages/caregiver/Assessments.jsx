import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import {
  DarkInput, DarkSelect, ModalShell, ErrorBanner,
} from '../../components/ui/FormComponents';
import useAssessments from '../../hooks/useAssessments';
import useResidents from '../../hooks/useResidents';

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

// Returns urgency meta for a single date
const dateMeta = (iso) => {
  const d = daysUntil(iso);
  if (d === null)  return null;
  if (d < 0)       return { label: `${Math.abs(d)}d overdue`, color: '#f87171', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)'   };
  if (d === 0)     return { label: 'Today!',                  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)'  };
  if (d <= 14)     return { label: `${d}d away`,              color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)'  };
  if (d <= 60)     return { label: `${d}d away`,              color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)'  };
  return             { label: `${d}d away`,                   color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)'  };
};

// Row-level urgency: worst of assessment_next_date and ncp_next_date
const rowUrgency = (a) => {
  const dates = [a.assessment_next_date, a.ncp_next_date].filter(Boolean);
  const days  = dates.map(daysUntil).filter(d => d !== null);
  if (!days.length) return 'ok';
  const min = Math.min(...days);
  if (min < 0)   return 'overdue';
  if (min <= 14) return 'due-soon';
  if (min <= 60) return 'upcoming';
  return 'ok';
};

const URGENCY_META = {
  overdue:  { label: 'Overdue',  color: '#f87171', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)',  icon: '🔴' },
  'due-soon':{ label: 'Due Soon',color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: '🟡' },
  upcoming: { label: 'Upcoming', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', icon: '🔵' },
  ok:       { label: 'On Track', color: '#34d399', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: '🟢' },
};

// ─── Section divider ──────────────────────────────────────────────────────────

const SectionLabel = ({ icon, title }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm">{icon}</span>
    <span className="text-xs font-bold tracking-widest uppercase"
      style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

// ─── Date field with inline urgency preview ───────────────────────────────────

const DateField = ({ label, value, onChange, hint }) => {
  const meta = value ? dateMeta(value) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</label>
      <input type="date" value={value} onChange={onChange}
        className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
        onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
        onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
      />
      {meta && (
        <p className="text-xs font-semibold" style={{ color: meta.color }}>
          {meta.label}
        </p>
      )}
      {!value && hint && (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{hint}</p>
      )}
    </div>
  );
};

// ─── Assessment form (shared by Create + Edit) ────────────────────────────────

const EMPTY_FORM = {
  resident:              '',
  assessment_start_date: '',
  assessment_next_date:  '',
  ncp_start_date:        '',
  ncp_next_date:         '',
  social_worker:         '',
};

const AssessmentForm = ({ form, setForm, errs, residents, isEdit = false }) => {
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const residentOptions = residents.map(r => ({
    value: String(r.id),
    label: `${r.first_name} ${r.last_name}`,
  }));

  return (
    <div className="space-y-5">
      {/* Resident */}
      {!isEdit ? (
        <DarkSelect label="Resident *" value={form.resident} onChange={set('resident')}
          options={residentOptions} placeholder="Select resident…" error={errs.resident} />
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Resident</label>
          <div className="w-full text-sm rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
            {residentOptions.find(r => r.value === form.resident)?.label ?? '—'}
          </div>
        </div>
      )}

      {/* Social worker */}
      <DarkInput label="Social Worker *" placeholder="e.g. Jane Kamau"
        value={form.social_worker} onChange={set('social_worker')} error={errs.social_worker} />

      {/* Assessment dates */}
      <SectionLabel icon="📋" title="Assessment Dates" />
      <div className="grid grid-cols-2 gap-3">
        <DateField label="Start Date"
          value={form.assessment_start_date} onChange={set('assessment_start_date')}
          hint="When the assessment began" />
        <DateField label="Next Date"
          value={form.assessment_next_date} onChange={set('assessment_next_date')}
          hint="Scheduled next assessment" />
      </div>

      {/* NCP dates */}
      <SectionLabel icon="📝" title="NCP (Nursing Care Plan) Dates" />
      <div className="grid grid-cols-2 gap-3">
        <DateField label="NCP Start Date"
          value={form.ncp_start_date} onChange={set('ncp_start_date')}
          hint="When the care plan started" />
        <DateField label="NCP Next Date"
          value={form.ncp_next_date} onChange={set('ncp_next_date')}
          hint="Next care plan review" />
      </div>
    </div>
  );
};

// ─── Create Modal ─────────────────────────────────────────────────────────────

const CreateModal = ({ residents, onClose, onSuccess, saving, saveError, setSaveError, createAssessment }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errs, setErrs] = useState({});

  const validate = () => {
    const e = {};
    if (!form.resident)              e.resident      = 'Select a resident';
    if (!form.social_worker.trim())  e.social_worker = 'Social worker name is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const payload = {
      resident:              form.resident || null,
      social_worker:         form.social_worker.trim(),
      assessment_start_date: form.assessment_start_date || null,
      assessment_next_date:  form.assessment_next_date  || null,
      ncp_start_date:        form.ncp_start_date        || null,
      ncp_next_date:         form.ncp_next_date          || null,
    };
    const result = await createAssessment(payload);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="New Assessment" subtitle="Record assessment and care plan dates for a resident" onClose={onClose}>
      <div className="space-y-5">
        <ErrorBanner message={saveError} />
        <AssessmentForm form={form} setForm={setForm} errs={errs} residents={residents} />
        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Saving…' : 'Create Assessment'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({ assessment, residents, onClose, onSuccess, saving, saveError, setSaveError, updateAssessment }) => {
  const [form, setForm] = useState({
    resident:              String(assessment.resident ?? ''),
    social_worker:         assessment.social_worker        ?? '',
    assessment_start_date: assessment.assessment_start_date ?? '',
    assessment_next_date:  assessment.assessment_next_date  ?? '',
    ncp_start_date:        assessment.ncp_start_date        ?? '',
    ncp_next_date:         assessment.ncp_next_date          ?? '',
  });
  const [errs, setErrs] = useState({});

  const validate = () => {
    const e = {};
    if (!form.social_worker.trim()) e.social_worker = 'Social worker name is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const payload = {
      resident:              form.resident || null,
      social_worker:         form.social_worker.trim(),
      assessment_start_date: form.assessment_start_date || null,
      assessment_next_date:  form.assessment_next_date  || null,
      ncp_start_date:        form.ncp_start_date        || null,
      ncp_next_date:         form.ncp_next_date          || null,
    };
    const result = await updateAssessment(assessment.id, payload);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell title="Edit Assessment" subtitle="Update assessment or care plan dates" onClose={onClose}>
      <div className="space-y-5">
        <ErrorBanner message={saveError} />
        <AssessmentForm form={form} setForm={setForm} errs={errs} residents={residents} isEdit />
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

// ─── Date display cell ────────────────────────────────────────────────────────

const DateCell = ({ iso, label }) => {
  const meta = iso ? dateMeta(iso) : null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'rgba(255,255,255,0.28)' }}>{label}</p>
      {iso ? (
        <>
          <p className="text-xs font-semibold text-white/80">{fmt(iso)}</p>
          {meta && <p className="text-[11px] font-bold" style={{ color: meta.color }}>{meta.label}</p>}
        </>
      ) : (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>Not set</p>
      )}
    </div>
  );
};

// ─── Assessment card ──────────────────────────────────────────────────────────

const AssessmentCard = ({ assessment, residentName, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const urgency = rowUrgency(assessment);
  const umeta   = URGENCY_META[urgency];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: urgency === 'overdue'
          ? '1px solid rgba(239,68,68,0.3)'
          : urgency === 'due-soon'
            ? '1px solid rgba(245,158,11,0.25)'
            : '1px solid rgba(255,255,255,0.07)',
      }}>
      {/* Urgency top stripe */}
      {urgency !== 'ok' && (
        <div className="h-0.5" style={{ background: `linear-gradient(90deg,${umeta.color},${umeta.color}60)` }} />
      )}

      <button type="button"
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

        {/* Urgency indicator */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: umeta.bg, border: `1px solid ${umeta.border}` }}>
          {umeta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{residentName}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: umeta.bg, color: umeta.color, border: `1px solid ${umeta.border}` }}>
              {umeta.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Social Worker: {assessment.social_worker || '—'}
          </p>
        </div>

        {/* Next dates mini summary */}
        <div className="hidden sm:flex flex-col gap-1 text-right shrink-0">
          {assessment.assessment_next_date && (
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Assessment: <span className="font-semibold text-white/70">{fmt(assessment.assessment_next_date)}</span>
            </p>
          )}
          {assessment.ncp_next_date && (
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              NCP: <span className="font-semibold text-white/70">{fmt(assessment.ncp_next_date)}</span>
            </p>
          )}
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Assessment dates section */}
          <div className="mt-3 space-y-2">
            <SectionLabel icon="📋" title="Assessment Dates" />
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <DateCell iso={assessment.assessment_start_date} label="Start Date" />
              </div>
              <div className="px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <DateCell iso={assessment.assessment_next_date} label="Next Date" />
              </div>
            </div>
          </div>

          {/* NCP dates section */}
          <div className="space-y-2">
            <SectionLabel icon="📝" title="NCP Dates" />
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <DateCell iso={assessment.ncp_start_date} label="NCP Start" />
              </div>
              <div className="px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <DateCell iso={assessment.ncp_next_date} label="NCP Next" />
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Social Worker', assessment.social_worker || '—'],
              ['Last Updated',  fmt(assessment.updated_at?.slice(0, 10))],
            ].map(([l, v]) => (
              <div key={l} className="px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
                <p className="text-xs font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>

          {/* Edit */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => onEdit(assessment)}>
              ✏️ Edit Assessment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Due-soon alert banner ────────────────────────────────────────────────────

const DueSoonBanner = ({ assessments, residentMap }) => {
  const urgent = useMemo(() =>
    assessments.filter(a => ['overdue', 'due-soon'].includes(rowUrgency(a))),
    [assessments]
  );
  if (!urgent.length) return null;

  const overdueCount  = urgent.filter(a => rowUrgency(a) === 'overdue').length;
  const dueSoonCount  = urgent.filter(a => rowUrgency(a) === 'due-soon').length;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
      <div className="px-5 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
        <span>⚠️</span>
        <p className="text-sm font-bold text-red-400">Assessments Need Attention</p>
        <div className="ml-auto flex gap-2">
          {overdueCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)' }}>
              {overdueCount} overdue
            </span>
          )}
          {dueSoonCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' }}>
              {dueSoonCount} due soon
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {urgent.map(a => {
          const u = URGENCY_META[rowUrgency(a)];
          return (
            <span key={a.id} className="text-xs px-3 py-1.5 rounded-xl font-semibold"
              style={{ background: u.bg, color: u.color, border: `1px solid ${u.border}` }}>
              {u.icon} {residentMap[String(a.resident)] ?? '—'}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CaregiverAssessments = () => {
  const [showCreate,     setShowCreate]     = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [residentFilter, setResidentFilter] = useState('');
  const [urgencyFilter,  setUrgencyFilter]  = useState('all');
  const [search,         setSearch]         = useState('');

  const {
    assessments, loading, error,
    saving, saveError, setSaveError,
    createAssessment, updateAssessment, refetch,
  } = useAssessments();

  const { residents } = useResidents();

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );

  const residentOptions = [
    { value: '', label: 'All Residents' },
    ...residents.map(r => ({ value: String(r.id), label: `${r.first_name} ${r.last_name}` })),
  ];

  const urgencyOptions = [
    { value: 'all',       label: 'All Status'  },
    { value: 'overdue',   label: '🔴 Overdue'  },
    { value: 'due-soon',  label: '🟡 Due Soon' },
    { value: 'upcoming',  label: '🔵 Upcoming' },
    { value: 'ok',        label: '🟢 On Track' },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assessments.filter(a =>
      (residentFilter === '' || String(a.resident) === residentFilter) &&
      (urgencyFilter  === 'all' || rowUrgency(a) === urgencyFilter) &&
      (!q ||
        residentMap[String(a.resident)]?.toLowerCase().includes(q) ||
        a.social_worker?.toLowerCase().includes(q))
    );
  }, [assessments, residentFilter, urgencyFilter, search, residentMap]);

  return (
    <DashboardLayout pageTitle="Assessments" pageSubtitle="Track resident assessment and care plan schedules">
      <div className="space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div />
          <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Assessment
          </Button>
        </div>

        {/* Urgent alert */}
        {!loading && assessments.length > 0 && (
          <DueSoonBanner assessments={assessments} residentMap={residentMap} />
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by resident or social worker…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
              onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>}
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <DarkSelect label="" value={residentFilter}
              onChange={e => setResidentFilter(e.target.value)}
              options={residentOptions} />
            <DarkSelect label="" value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value)}
              options={urgencyOptions} />
          </div>
        </div>

        {/* Count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filtered.length} assessment{filtered.length !== 1 ? 's' : ''}
            {(residentFilter || urgencyFilter !== 'all' || search) ? ' · filtered' : ''}
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
        {!loading && !error && assessments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-5xl">📋</span>
            <div>
              <p className="text-base font-black text-white mb-2">No assessments yet</p>
              <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Create an assessment record to track a resident's assessment schedule and nursing care plan dates.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              Create First Assessment
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && assessments.length > 0 && (
          <div className="text-center py-10 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/50 text-sm">No assessments match your filters.</p>
          </div>
        )}

        {/* Assessment cards */}
        {!loading && filtered.map(a => (
          <AssessmentCard
            key={a.id}
            assessment={a}
            residentName={residentMap[String(a.resident)] ?? '—'}
            onEdit={setEditTarget}
          />
        ))}
      </div>

      {showCreate && (
        <CreateModal
          residents={residents}
          onClose={() => { setShowCreate(false); setSaveError(null); }}
          onSuccess={() => { setShowCreate(false); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          createAssessment={createAssessment}
        />
      )}

      {editTarget && (
        <EditModal
          assessment={editTarget}
          residents={residents}
          onClose={() => { setEditTarget(null); setSaveError(null); }}
          onSuccess={() => { setEditTarget(null); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          updateAssessment={updateAssessment}
        />
      )}
    </DashboardLayout>
  );
};

export default CaregiverAssessments;