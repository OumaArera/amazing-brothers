import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useFacilities from '../../hooks/useFacilities';

// ─── shared dark-themed input ────────────────────────────────────────────────

const DarkInput = ({ label, error, hint, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
      {label}
    </label>
    <input
      className="w-full text-sm rounded-xl px-4 py-3 transition-all duration-200 focus:outline-none"
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
    {error && <p className="text-xs text-red-400 flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {error}
    </p>}
  </div>
);

// ─── modal shell ─────────────────────────────────────────────────────────────

const ModalShell = ({ children, title, subtitle, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div
      className="w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
      style={{
        background: '#130d2e',
        border: '1px solid rgba(124,58,237,0.25)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <h2 className="text-base font-black text-white">{title}</h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all mt-0.5 shrink-0"
          style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Body */}
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── CreateFacilityModal ──────────────────────────────────────────────────────

const CreateFacilityModal = ({ onClose, onSuccess, saving, saveError, setSaveError, createFacility }) => {
  const [form, setForm]         = useState({ name: '', address: '' });
  const [fieldErrors, setErrors] = useState({});

  const set = key => e => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: undefined }));
    if (saveError) setSaveError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Facility name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    return e;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setErrors(errors); return; }
    const result = await createFacility({ name: form.name.trim(), address: form.address.trim() });
    if (result.success) onSuccess(result.data);
  };

  return (
    <ModalShell title="Add Facility" subtitle="Create a new care facility location" onClose={onClose}>
      <div className="space-y-4">
        {/* API error */}
        {saveError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            <span className="shrink-0">⚠️</span>
            <span>{saveError}</span>
          </div>
        )}

        <DarkInput
          label="Facility Name"
          placeholder="e.g. Amazing Brothers — Main House"
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name}
        />

        <DarkInput
          label="Address"
          placeholder="e.g. 123 Westlands Rd, Nairobi"
          value={form.address}
          onChange={set('address')}
          error={fieldErrors.address}
          hint="Include street, city, and any relevant postcode"
        />

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Creating…' : 'Create Facility'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── EditFacilityModal ────────────────────────────────────────────────────────

const EditFacilityModal = ({ facility, onClose, onSuccess, saving, saveError, setSaveError, updateFacility }) => {
  const [form, setForm]         = useState({ name: facility.name, address: facility.address });
  const [fieldErrors, setErrors] = useState({});

  const set = key => e => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: undefined }));
    if (saveError) setSaveError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Facility name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    return e;
  };

  // Only send changed fields
  const dirtyPayload = () => {
    const payload = {};
    if (form.name.trim()    !== facility.name)    payload.name    = form.name.trim();
    if (form.address.trim() !== facility.address) payload.address = form.address.trim();
    return payload;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setErrors(errors); return; }
    const payload = dirtyPayload();
    if (Object.keys(payload).length === 0) { onClose(); return; } // nothing changed
    const result = await updateFacility(facility.id, payload);
    if (result.success) onSuccess(result.data);
  };

  const hasChanges = form.name.trim() !== facility.name || form.address.trim() !== facility.address;

  return (
    <ModalShell
      title="Edit Facility"
      subtitle={`Updating: ${facility.name}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {saveError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            <span className="shrink-0">⚠️</span>
            <span>{saveError}</span>
          </div>
        )}

        <DarkInput
          label="Facility Name"
          placeholder="e.g. Amazing Brothers — Main House"
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name}
        />

        <DarkInput
          label="Address"
          placeholder="e.g. 123 Westlands Rd, Nairobi"
          value={form.address}
          onChange={set('address')}
          error={fieldErrors.address}
        />

        {/* Changed indicator */}
        {hasChanges && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            You have unsaved changes
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button
            variant="primary" size="md" fullWidth
            loading={saving}
            disabled={!hasChanges}
            onClick={handleSubmit}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── FacilityCard ─────────────────────────────────────────────────────────────

const FacilityCard = ({ facility, index, onEdit }) => {
  const CARD_ACCENTS = [
    { gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.35)', light: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
    { gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.35)',   light: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.22)'   },
    { gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.35)',  light: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.22)'  },
    { gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', glow: 'rgba(245,158,11,0.35)',  light: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.22)'  },
    { gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)', glow: 'rgba(236,72,153,0.35)',  light: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.22)'  },
  ];
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  // Build initials from facility name (up to 2 words)
  const nameInitials = facility.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="group relative rounded-2xl p-5 transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,0.07)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = accent.light;
        e.currentTarget.style.border = `1px solid ${accent.border}`;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 16px 40px ${accent.glow.replace('0.35', '0.18')}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Gradient top stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: accent.gradient }} />

      <div className="flex items-start justify-between gap-3">
        {/* Icon badge */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
          style={{ background: accent.gradient, boxShadow: `0 4px 14px ${accent.glow.replace('0.35','0.3')}` }}>
          {nameInitials}
        </div>

        {/* Edit button — appears on hover */}
        <button
          onClick={() => onEdit(facility)}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.28)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        <h3 className="font-bold text-white text-base leading-tight">{facility.name}</h3>
        <div className="flex items-start gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {facility.address}
          </p>
        </div>
      </div>

      {/* ID chip */}
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          ID: {facility.id}
        </p>
      </div>
    </div>
  );
};

// ─── Main Facilities Page ─────────────────────────────────────────────────────

const Facilities = () => {
  const {
    facilities, loading, error,
    saving, saveError, setSaveError,
    createFacility, updateFacility, refetch,
  } = useFacilities();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // facility being edited
  const [search, setSearch]         = useState('');

  const filtered = facilities.filter(f => {
    const q = search.toLowerCase();
    return !q || f.name?.toLowerCase().includes(q) || f.address?.toLowerCase().includes(q);
  });

  const handleCreated = () => {
    setShowCreate(false);
    setSaveError(null);
  };

  const handleUpdated = () => {
    setEditTarget(null);
    setSaveError(null);
  };

  const closeCreate = () => { setShowCreate(false); setSaveError(null); };
  const closeEdit   = () => { setEditTarget(null);  setSaveError(null); };

  return (
    <DashboardLayout pageTitle="Facilities" pageSubtitle="Manage your care facility locations">
      <div className="space-y-6 animate-slide-up">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <svg xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search facilities…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>

            {/* Count badge */}
            {!loading && (
              <span className="text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
                {filtered.length} {filtered.length === 1 ? 'facility' : 'facilities'}
              </span>
            )}
          </div>

          <Button variant="primary" size="md" onClick={() => setShowCreate(true)} className="w-full sm:w-auto shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Facility
          </Button>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-2xl animate-pulse"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Loading facilities…
            </p>
          </div>
        )}

        {/* ── Fetch error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-5xl">⚠️</div>
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <Button variant="ghost" size="sm" onClick={refetch}>Try Again</Button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && facilities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>
              🏢
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">No facilities yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Add your first care facility to get started
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              Add First Facility
            </Button>
          </div>
        )}

        {/* ── Search empty ── */}
        {!loading && !error && facilities.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-semibold text-white">No facilities match "{search}"</p>
            <button onClick={() => setSearch('')} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Clear search
            </button>
          </div>
        )}

        {/* ── Cards grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((facility, index) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                index={index}
                onEdit={setEditTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateFacilityModal
          onClose={closeCreate}
          onSuccess={handleCreated}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          createFacility={createFacility}
        />
      )}

      {editTarget && (
        <EditFacilityModal
          facility={editTarget}
          onClose={closeEdit}
          onSuccess={handleUpdated}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          updateFacility={updateFacility}
        />
      )}
    </DashboardLayout>
  );
};

export default Facilities;