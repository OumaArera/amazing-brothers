import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useResidents from '../../hooks/useResidents';
import useBranches from '../../hooks/useBranches';
import {
  DarkInput,
  DarkSelect,
  ModalShell,
  ErrorBanner,
  UnsavedBadge,
} from '../../components/ui/FormComponents';

// ─── constants & helpers ──────────────────────────────────────────────────────

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const age = dob => {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const initials = r =>
  `${r.first_name?.[0] ?? ''}${r.last_name?.[0] ?? ''}`.toUpperCase() || '?';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#0891b2,#06b6d4)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#f97316)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
];
const avatarGrad = id =>
  AVATAR_GRADIENTS[(id?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length];

const EMPTY_FORM = {
  first_name: '', middle_names: '', last_name: '',
  date_of_birth: '', diagnosis: '', allergies: '',
  physician_name: '', pcp_or_doctor: '', clinician: '',
  branch: '', room: '', cart: '', active: true,
};

// ─── Section header inside modal ─────────────────────────────────────────────

const SectionLabel = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    <span className="text-base">{icon}</span>
    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
      {title}
    </span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
  </div>
);

// ─── DarkTextarea ─────────────────────────────────────────────────────────────

const DarkTextarea = ({ label, error, hint, rows = 3, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</label>
    )}
    <textarea
      rows={rows}
      className="w-full text-sm rounded-xl px-4 py-3 transition-all duration-200 focus:outline-none resize-none"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)',
        color: '#fff',
        colorScheme: 'dark',
      }}
      onFocus={e => {
        if (!error) e.target.style.border = '1px solid rgba(124,58,237,0.55)';
        e.target.style.background = 'rgba(124,58,237,0.07)';
      }}
      onBlur={e => {
        e.target.style.border = error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)';
        e.target.style.background = 'rgba(255,255,255,0.07)';
      }}
      {...props}
    />
    {hint && !error && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{hint}</p>}
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

// ─── DarkToggle ───────────────────────────────────────────────────────────────

const DarkToggle = ({ label, checked, onChange, hint }) => (
  <div className="flex items-center justify-between px-4 py-3 rounded-xl"
    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
    <div>
      <p className="text-sm font-semibold text-white">{label}</p>
      {hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{hint}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-300"
      style={{ background: checked ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.15)' }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm"
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  </div>
);

// ─── ResidentForm — shared between create and edit ────────────────────────────

const ResidentForm = ({
  form, onChange, fieldErrors,
  saveError, setSaveError,
  branchOptions, saving,
  onSubmit, onCancel, submitLabel,
  hasChanges,
}) => {
  const set = key => e => {
    onChange(key, e.target.value);
    if (saveError) setSaveError(null);
  };

  return (
    <div className="space-y-5">
      <ErrorBanner message={saveError} />

      {/* ── Personal ── */}
      <SectionLabel icon="👤" title="Personal Information" />
      <div className="grid grid-cols-2 gap-3">
        <DarkInput label="First Name *" placeholder="Jane" value={form.first_name} onChange={set('first_name')} error={fieldErrors.first_name} />
        <DarkInput label="Last Name *" placeholder="Kamau" value={form.last_name} onChange={set('last_name')} error={fieldErrors.last_name} />
      </div>
      <DarkInput label="Middle Name(s)" placeholder="Optional" value={form.middle_names} onChange={set('middle_names')} />
      <div className="grid grid-cols-2 gap-3">
        <DarkInput label="Date of Birth *" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} error={fieldErrors.date_of_birth} />
        <div /> {/* spacer */}
      </div>

      {/* ── Medical ── */}
      <SectionLabel icon="🏥" title="Medical Information" />
      <DarkInput label="Physician Name *" placeholder="Dr. John Otieno" value={form.physician_name} onChange={set('physician_name')} error={fieldErrors.physician_name} />
      <div className="grid grid-cols-2 gap-3">
        <DarkInput label="PCP / Doctor *" placeholder="Primary care provider" value={form.pcp_or_doctor} onChange={set('pcp_or_doctor')} error={fieldErrors.pcp_or_doctor} />
        <DarkInput label="Clinician" placeholder="Optional" value={form.clinician} onChange={set('clinician')} />
      </div>
      <DarkTextarea
        label="Diagnosis"
        placeholder="Primary and secondary diagnoses…"
        value={form.diagnosis}
        onChange={set('diagnosis')}
        hint="Separate multiple diagnoses with commas or new lines"
      />
      <DarkTextarea
        label="Allergies"
        placeholder="Known allergies and reactions…"
        value={form.allergies}
        onChange={set('allergies')}
        hint="Include medication, food, and environmental allergies"
        rows={2}
      />

      {/* ── Assignment ── */}
      <SectionLabel icon="🏡" title="Assignment" />
      <DarkSelect
        label="Branch"
        value={form.branch}
        onChange={set('branch')}
        options={branchOptions}
        placeholder="Select branch…"
        error={fieldErrors.branch}
      />
      <div className="grid grid-cols-2 gap-3">
        <DarkInput label="Room" placeholder="e.g. 1A" value={form.room} onChange={set('room')} />
        <DarkInput label="Cart" placeholder="e.g. Cart 2" value={form.cart} onChange={set('cart')} />
      </div>
      <DarkToggle
        label="Active Resident"
        checked={form.active}
        onChange={val => onChange('active', val)}
        hint={form.active ? 'Resident is currently active in this facility' : 'Resident is marked as inactive'}
      />

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
  if (!form.first_name.trim())    e.first_name    = 'Required';
  if (!form.last_name.trim())     e.last_name     = 'Required';
  if (!form.date_of_birth)        e.date_of_birth = 'Required';
  if (!form.physician_name.trim()) e.physician_name = 'Required';
  if (!form.pcp_or_doctor.trim()) e.pcp_or_doctor = 'Required';
  return e;
};

// ─── CreateResidentModal ──────────────────────────────────────────────────────

const CreateResidentModal = ({ onClose, onSuccess, saving, saveError, setSaveError, createResident, branchOptions }) => {
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    const payload = {
      first_name:     form.first_name.trim(),
      last_name:      form.last_name.trim(),
      date_of_birth:  form.date_of_birth,
      physician_name: form.physician_name.trim(),
      pcp_or_doctor:  form.pcp_or_doctor.trim(),
      active:         form.active,
      ...(form.middle_names.trim()  && { middle_names:  form.middle_names.trim()  }),
      ...(form.diagnosis.trim()     && { diagnosis:     form.diagnosis.trim()     }),
      ...(form.allergies.trim()     && { allergies:     form.allergies.trim()     }),
      ...(form.clinician.trim()     && { clinician:     form.clinician.trim()     }),
      ...(form.room.trim()          && { room:          form.room.trim()          }),
      ...(form.cart.trim()          && { cart:          form.cart.trim()          }),
      ...(form.branch               && { branch:        form.branch               }),
    };

    const result = await createResident(payload);
    if (result.success) onSuccess(result.data);
  };

  return (
    <ModalShell
      title="Add Resident"
      subtitle="Enter resident details to create their profile"
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <ResidentForm
        form={form} onChange={onChange}
        fieldErrors={fieldErrors}
        saveError={saveError} setSaveError={setSaveError}
        branchOptions={branchOptions}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Create Resident"
        hasChanges={undefined}
      />
    </ModalShell>
  );
};

// ─── EditResidentPanel (slide-over) ──────────────────────────────────────────

const EditResidentPanel = ({ resident, onClose, onSuccess, saving, saveError, setSaveError, updateResident, branchOptions }) => {
  const [form, setForm] = useState({
    first_name:     resident.first_name    ?? '',
    middle_names:   resident.middle_names  ?? '',
    last_name:      resident.last_name     ?? '',
    date_of_birth:  resident.date_of_birth ?? '',
    diagnosis:      resident.diagnosis     ?? '',
    allergies:      resident.allergies     ?? '',
    physician_name: resident.physician_name ?? '',
    pcp_or_doctor:  resident.pcp_or_doctor  ?? '',
    clinician:      resident.clinician     ?? '',
    branch:         resident.branch        ?? '',
    room:           resident.room          ?? '',
    cart:           resident.cart          ?? '',
    active:         resident.active        ?? true,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
  };

  // Dirty-check: compare every field to original
  const hasChanges = useMemo(() => (
    form.first_name     !== (resident.first_name     ?? '') ||
    form.middle_names   !== (resident.middle_names   ?? '') ||
    form.last_name      !== (resident.last_name      ?? '') ||
    form.date_of_birth  !== (resident.date_of_birth  ?? '') ||
    form.diagnosis      !== (resident.diagnosis      ?? '') ||
    form.allergies      !== (resident.allergies      ?? '') ||
    form.physician_name !== (resident.physician_name ?? '') ||
    form.pcp_or_doctor  !== (resident.pcp_or_doctor  ?? '') ||
    form.clinician      !== (resident.clinician      ?? '') ||
    String(form.branch) !== String(resident.branch   ?? '') ||
    form.room           !== (resident.room           ?? '') ||
    form.cart           !== (resident.cart           ?? '') ||
    form.active         !== (resident.active         ?? true)
  ), [form, resident]);

  const handleSubmit = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    if (!hasChanges) { onClose(); return; }

    // Build dirty payload — only changed fields
    const orig = resident;
    const payload = {};
    if (form.first_name     !== (orig.first_name     ?? '')) payload.first_name     = form.first_name.trim();
    if (form.middle_names   !== (orig.middle_names   ?? '')) payload.middle_names   = form.middle_names.trim() || null;
    if (form.last_name      !== (orig.last_name      ?? '')) payload.last_name      = form.last_name.trim();
    if (form.date_of_birth  !== (orig.date_of_birth  ?? '')) payload.date_of_birth  = form.date_of_birth;
    if (form.diagnosis      !== (orig.diagnosis      ?? '')) payload.diagnosis      = form.diagnosis.trim()  || null;
    if (form.allergies      !== (orig.allergies      ?? '')) payload.allergies      = form.allergies.trim()  || null;
    if (form.physician_name !== (orig.physician_name ?? '')) payload.physician_name = form.physician_name.trim();
    if (form.pcp_or_doctor  !== (orig.pcp_or_doctor  ?? '')) payload.pcp_or_doctor  = form.pcp_or_doctor.trim();
    if (form.clinician      !== (orig.clinician      ?? '')) payload.clinician      = form.clinician.trim()  || null;
    if (String(form.branch) !== String(orig.branch   ?? '')) payload.branch         = form.branch || null;
    if (form.room           !== (orig.room           ?? '')) payload.room           = form.room.trim()       || null;
    if (form.cart           !== (orig.cart           ?? '')) payload.cart           = form.cart.trim()       || null;
    if (form.active         !== (orig.active         ?? true)) payload.active       = form.active;

    const result = await updateResident(resident.id, payload);
    if (result.success) onSuccess(result.data);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-130 flex flex-col"
        style={{ background: '#130d2e', borderLeft: '1px solid rgba(124,58,237,0.25)', boxShadow: '-24px 0 64px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
              style={{ background: avatarGrad(resident.id) }}>
              {initials(resident)}
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">
                {resident.first_name} {resident.last_name}
              </h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Edit resident profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
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
          <ResidentForm
            form={form} onChange={onChange}
            fieldErrors={fieldErrors}
            saveError={saveError} setSaveError={setSaveError}
            branchOptions={branchOptions}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Save Changes"
            hasChanges={hasChanges}
          />
        </div>
      </div>
    </>
  );
};

// ─── ResidentCard (grid view) ─────────────────────────────────────────────────

const ResidentCard = ({ resident, onSelect }) => (
  <div
    className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-250 flex flex-col gap-3"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    onClick={() => onSelect(resident)}
    onMouseEnter={e => {
      e.currentTarget.style.background  = 'rgba(124,58,237,0.07)';
      e.currentTarget.style.border      = '1px solid rgba(124,58,237,0.28)';
      e.currentTarget.style.transform   = 'translateY(-3px)';
      e.currentTarget.style.boxShadow   = '0 16px 40px rgba(124,58,237,0.15)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background  = 'rgba(255,255,255,0.03)';
      e.currentTarget.style.border      = '1px solid rgba(255,255,255,0.07)';
      e.currentTarget.style.transform   = 'translateY(0)';
      e.currentTarget.style.boxShadow   = 'none';
    }}
  >
    {/* Active status stripe */}
    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
      style={{ background: resident.active ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'rgba(255,255,255,0.1)' }} />

    {/* Avatar + name */}
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shrink-0"
        style={{ background: avatarGrad(resident.id), boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        {initials(resident)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-sm leading-tight truncate">
          {resident.first_name} {resident.middle_names ? `${resident.middle_names} ` : ''}{resident.last_name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {age(resident.date_of_birth)} yrs · {fmt(resident.date_of_birth)}
        </p>
        {/* Status badge */}
        <span
          className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={resident.active
            ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
            : { background: 'rgba(100,116,139,0.2)',  color: '#94a3b8',  border: '1px solid rgba(100,116,139,0.25)' }
          }
        >
          <span className="w-1.5 h-1.5 rounded-full"
            style={{ background: resident.active ? '#10b981' : '#64748b' }} />
          {resident.active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>

    {/* Details grid */}
    <div className="grid grid-cols-2 gap-2 text-xs">
      {[
        { icon: '💊', label: 'Physician', val: resident.physician_name },
        { icon: '🏥', label: 'Doctor',    val: resident.pcp_or_doctor  },
        { icon: '🚪', label: 'Room',      val: resident.room || '—'    },
        { icon: '🌿', label: 'Branch',    val: resident.branch_name || (typeof resident.branch === 'string' ? '—' : (resident.branch?.name ?? '—')) },
      ].map(({ icon, label, val }) => (
        <div key={label} className="rounded-lg px-2.5 py-1.5"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{icon} {label}</p>
          <p className="font-semibold text-white/80 truncate">{val || '—'}</p>
        </div>
      ))}
    </div>

    {/* Diagnosis snippet */}
    {resident.diagnosis && (
      <div className="rounded-xl px-3 py-2"
        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <p className="text-[10px] font-bold mb-0.5 text-violet-400">DIAGNOSIS</p>
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {resident.diagnosis}
        </p>
      </div>
    )}

    {/* Allergies */}
    {resident.allergies && (
      <div className="rounded-xl px-3 py-2"
        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <p className="text-[10px] font-bold mb-0.5 text-red-400">⚠ ALLERGIES</p>
        <p className="text-xs leading-relaxed line-clamp-1 text-red-300/70">{resident.allergies}</p>
      </div>
    )}

    {/* Edit hint */}
    <p className="text-[10px] text-center font-medium transition-opacity opacity-0 group-hover:opacity-100"
      style={{ color: '#a78bfa' }}>
      Click to view & edit →
    </p>
  </div>
);

// ─── ResidentRow (table view) ─────────────────────────────────────────────────

const ResidentRow = ({ resident, index, onSelect }) => (
  <div
    className="grid grid-cols-12 gap-3 px-5 py-3.5 cursor-pointer transition-all duration-150 items-center"
    style={{ borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
    onClick={() => onSelect(resident)}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    {/* Name */}
    <div className="col-span-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
        style={{ background: avatarGrad(resident.id) }}>
        {initials(resident)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate">
          {resident.first_name} {resident.last_name}
        </p>
        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {age(resident.date_of_birth)} yrs
        </p>
      </div>
    </div>

    {/* Room */}
    <div className="col-span-1">
      <span className="text-xs px-2 py-1 rounded-lg font-mono font-bold"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
        {resident.room || '—'}
      </span>
    </div>

    {/* Physician */}
    <div className="col-span-2">
      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {resident.physician_name || '—'}
      </p>
    </div>

    {/* Branch */}
    <div className="col-span-2">
      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {resident.branch_name || '—'}
      </p>
    </div>

    {/* Allergies flag */}
    <div className="col-span-1 flex items-center">
      {resident.allergies
        ? <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>⚠ Yes</span>
        : <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
      }
    </div>

    {/* Status */}
    <div className="col-span-2 flex items-center justify-end gap-2">
      <span
        className="text-xs px-2.5 py-1 rounded-full font-bold"
        style={resident.active
          ? { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
          : { background: 'rgba(100,116,139,0.2)',  color: '#94a3b8',  border: '1px solid rgba(100,116,139,0.25)' }
        }
      >
        {resident.active ? 'Active' : 'Inactive'}
      </span>
    </div>
  </div>
);

// ─── Main Residents page ──────────────────────────────────────────────────────

const Residents = () => {
  const {
    residents, loading, error,
    saving, saveError, setSaveError,
    createResident, updateResident, refetch,
  } = useResidents();

  const { branches } = useBranches();

  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [search, setSearch]           = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [view, setView]               = useState('grid'); // 'grid' | 'list'

  const branchOptions = branches.map(b => ({ value: b.id, label: b.name }));

  // Enrich residents with branch name for display
  const enriched = useMemo(() =>
    residents.map(r => ({
      ...r,
      branch_name: branches.find(b => b.id === r.branch || b.id === r.branch?.id)?.name ?? null,
    })),
    [residents, branches]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enriched.filter(r => {
      const matchSearch = !q ||
        r.first_name?.toLowerCase().includes(q)  ||
        r.last_name?.toLowerCase().includes(q)   ||
        r.middle_names?.toLowerCase().includes(q)||
        r.room?.toLowerCase().includes(q)         ||
        r.physician_name?.toLowerCase().includes(q);

      const matchBranch = branchFilter === 'all' ||
        String(r.branch) === branchFilter ||
        String(r.branch?.id) === branchFilter;

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'   &&  r.active) ||
        (statusFilter === 'inactive' && !r.active);

      return matchSearch && matchBranch && matchStatus;
    });
  }, [enriched, search, branchFilter, statusFilter]);

  const stats = useMemo(() => ({
    total:    residents.length,
    active:   residents.filter(r => r.active).length,
    inactive: residents.filter(r => !r.active).length,
    withAllergies: residents.filter(r => r.allergies).length,
  }), [residents]);

  const closeCreate = () => { setShowCreate(false); setSaveError(null); };
  const closeEdit   = () => { setEditTarget(null);  setSaveError(null); };

  return (
    <DashboardLayout pageTitle="Residents" pageSubtitle="Manage resident profiles and assignments">
      <div className="space-y-5 animate-slide-up">

        {/* ── Stats ── */}
        {!loading && !error && residents.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Residents', value: stats.total,         gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.25)' },
              { label: 'Active',          value: stats.active,        gradient: 'linear-gradient(90deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.25)' },
              { label: 'Inactive',        value: stats.inactive,      gradient: 'linear-gradient(90deg,#64748b,#94a3b8)', glow: 'rgba(100,116,139,0.2)'  },
              { label: 'Have Allergies',  value: stats.withAllergies, gradient: 'linear-gradient(90deg,#ef4444,#f97316)', glow: 'rgba(239,68,68,0.25)'   },
            ].map(s => (
              <div key={s.label}
                className="relative rounded-2xl p-4 overflow-hidden transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${s.glow}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: s.gradient }} />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3">
          {/* Row 1: search + add button */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              {/* <svg xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg> */}
              {/* <input
                type="text"
                placeholder="Search by name, room, or physician…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              /> */}
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
                { id: 'grid', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
                { id: 'list', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
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
              <span className="hidden sm:inline">Add Resident</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          {/* Row 2: filter chips */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status filters */}
            <div className="flex gap-1.5">
              {[
                { id: 'all',      label: 'All Status' },
                { id: 'active',   label: '● Active'   },
                { id: 'inactive', label: '○ Inactive' },
              ].map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={statusFilter === f.id ? {
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
            </div>

            {/* Divider */}
            {branches.length > 0 && (
              <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />
            )}

            {/* Branch filters */}
            {branches.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setBranchFilter('all')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={branchFilter === 'all' ? {
                    background: 'rgba(6,182,212,0.25)', color: '#22d3ee',
                    border: '1px solid rgba(6,182,212,0.35)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                  All Branches
                </button>
                {branches.map(b => (
                  <button key={b.id} onClick={() => setBranchFilter(String(b.id))}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all truncate max-w-35"
                    title={b.name}
                    style={branchFilter === String(b.id) ? {
                      background: 'rgba(6,182,212,0.25)', color: '#22d3ee',
                      border: '1px solid rgba(6,182,212,0.35)',
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                    }}>
                    {b.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active filter count */}
            {!loading && (
              <span className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                {filtered.length} shown
              </span>
            )}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-2xl animate-pulse"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Loading residents…
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
        {!loading && !error && residents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>
              🧑‍🦳
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">No residents yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Add your first resident to begin managing their care profile
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              Add First Resident
            </Button>
          </div>
        )}

        {/* ── No search results ── */}
        {!loading && !error && residents.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-semibold text-white">No residents match your filters</p>
            <button
              onClick={() => { setSearch(''); setBranchFilter('all'); setStatusFilter('all'); }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* ── Grid view ── */}
        {!loading && !error && filtered.length > 0 && view === 'grid' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(r => (
              <ResidentCard key={r.id} resident={r} onSelect={setEditTarget} />
            ))}
          </div>
        )}

        {/* ── List view ── */}
        {!loading && !error && filtered.length > 0 && view === 'list' && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 text-xs font-bold tracking-widest uppercase"
              style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="col-span-4">Resident</div>
              <div className="col-span-1">Room</div>
              <div className="col-span-2">Physician</div>
              <div className="col-span-2">Branch</div>
              <div className="col-span-1">Allergies</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {filtered.map((r, i) => (
              <ResidentRow key={r.id} resident={r} index={i} onSelect={setEditTarget} />
            ))}
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateResidentModal
          onClose={closeCreate}
          onSuccess={() => { setShowCreate(false); setSaveError(null); }}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          createResident={createResident}
          branchOptions={branchOptions}
        />
      )}

      {/* ── Edit slide-over ── */}
      {editTarget && (
        <EditResidentPanel
          resident={editTarget}
          onClose={closeEdit}
          onSuccess={() => { setEditTarget(null); setSaveError(null); }}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          updateResident={updateResident}
          branchOptions={branchOptions}
        />
      )}
    </DashboardLayout>
  );
};

export default Residents;