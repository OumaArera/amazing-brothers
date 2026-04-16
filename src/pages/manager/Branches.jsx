import { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useBranches from '../../hooks/useBranches';
import useFacilities from '../../hooks/useFacilities';
import {
  DarkInput,
  DarkSelect,
  ModalShell,
  ErrorBanner,
  UnsavedBadge,
} from '../../components/ui/FormComponents';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = iso =>
  iso
    ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const CARD_ACCENTS = [
  { gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.2)',  light: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', tag: 'rgba(124,58,237,0.18)', tagText: '#a78bfa' },
  { gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.2)',   light: 'rgba(6,182,212,0.07)',  border: 'rgba(6,182,212,0.22)',  tag: 'rgba(6,182,212,0.15)',   tagText: '#22d3ee' },
  { gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.2)',  light: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.22)', tag: 'rgba(16,185,129,0.15)',  tagText: '#34d399' },
  { gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', glow: 'rgba(245,158,11,0.2)',  light: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.22)', tag: 'rgba(245,158,11,0.15)',  tagText: '#fbbf24' },
  { gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)', glow: 'rgba(236,72,153,0.2)',  light: 'rgba(236,72,153,0.07)', border: 'rgba(236,72,153,0.22)', tag: 'rgba(236,72,153,0.15)',  tagText: '#f472b6' },
];

const accent = idx => CARD_ACCENTS[idx % CARD_ACCENTS.length];

const nameInitials = name =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

// ─── BranchForm — shared fields used in both create and edit modals ───────────

const BranchForm = ({
  form, setForm, fieldErrors, setFieldErrors,
  saveError, setSaveError,
  facilityOptions, saving,
  onSubmit, onCancel,
  submitLabel,
  hasChanges,
}) => {
  const set = key => e => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setFieldErrors(p => ({ ...p, [key]: undefined }));
    if (saveError) setSaveError(null);
  };

  return (
    <div className="space-y-4">
      <ErrorBanner message={saveError} />

      <DarkInput
        label="Branch Name"
        placeholder="e.g. Westlands Branch"
        value={form.name}
        onChange={set('name')}
        error={fieldErrors.name}
      />

      <DarkInput
        label="Address"
        placeholder="e.g. Ojijo Oteko Rd, Westlands"
        value={form.address}
        onChange={set('address')}
        error={fieldErrors.address}
        hint="Street address of this branch location"
      />

      <DarkSelect
        label="Facility"
        value={form.facility_id}
        onChange={set('facility_id')}
        options={facilityOptions}
        placeholder={facilityOptions.length === 0 ? 'No facilities available' : 'Select facility…'}
        error={fieldErrors.facility_id}
        hint="The parent facility this branch belongs to"
      />

      {/* No facilities warning */}
      {facilityOptions.length === 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>No facilities found. Please create a facility first before adding a branch.</span>
        </div>
      )}

      <UnsavedBadge visible={hasChanges} />

      <div className="flex gap-3 pt-1">
        <Button variant="outline" size="md" fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary" size="md" fullWidth
          loading={saving}
          disabled={saving || facilityOptions.length === 0 || (hasChanges === false)}
          onClick={onSubmit}
        >
          {saving ? `${submitLabel.replace(/^(\w+).*/, '$1')}ing…` : submitLabel}
        </Button>
      </div>
    </div>
  );
};

// ─── CreateBranchModal ────────────────────────────────────────────────────────

const CreateBranchModal = ({ onClose, onSuccess, saving, saveError, setSaveError, createBranch, facilityOptions }) => {
  const [form, setForm]           = useState({ name: '', address: '', facility_id: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Branch name is required';
    if (!form.address.trim())     e.address     = 'Address is required';
    if (!form.facility_id)        e.facility_id = 'Please select a facility';
    return e;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    const result = await createBranch({
      name:        form.name.trim(),
      address:     form.address.trim(),
      facility_id: Number(form.facility_id),
    });
    if (result.success) onSuccess(result.data);
  };

  return (
    <ModalShell title="Add Branch" subtitle="Create a new branch under an existing facility" onClose={onClose}>
      <BranchForm
        form={form} setForm={setForm}
        fieldErrors={fieldErrors} setFieldErrors={setFieldErrors}
        saveError={saveError} setSaveError={setSaveError}
        facilityOptions={facilityOptions}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Create Branch"
        hasChanges={undefined} /* always enabled for create */
      />
    </ModalShell>
  );
};

// ─── EditBranchModal ──────────────────────────────────────────────────────────

const EditBranchModal = ({ branch, onClose, onSuccess, saving, saveError, setSaveError, updateBranch, facilityOptions }) => {
  const [form, setForm] = useState({
    name:        branch.name,
    address:     branch.address,
    facility_id: String(branch.facility?.id ?? ''),
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Branch name is required';
    if (!form.address.trim())     e.address     = 'Address is required';
    if (!form.facility_id)        e.facility_id = 'Please select a facility';
    return e;
  };

  // Only send fields that actually changed
  const dirtyPayload = () => {
    const payload = {};
    if (form.name.trim()    !== branch.name)                payload.name        = form.name.trim();
    if (form.address.trim() !== branch.address)             payload.address     = form.address.trim();
    if (form.facility_id    !== String(branch.facility?.id)) payload.facility_id = Number(form.facility_id);
    return payload;
  };

  const hasChanges =
    form.name.trim()    !== branch.name ||
    form.address.trim() !== branch.address ||
    form.facility_id    !== String(branch.facility?.id ?? '');

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    const payload = dirtyPayload();
    if (Object.keys(payload).length === 0) { onClose(); return; }
    const result = await updateBranch(branch.id, payload);
    if (result.success) onSuccess(result.data);
  };

  return (
    <ModalShell
      title="Edit Branch"
      subtitle={`Updating: ${branch.name}`}
      onClose={onClose}
    >
      <BranchForm
        form={form} setForm={setForm}
        fieldErrors={fieldErrors} setFieldErrors={setFieldErrors}
        saveError={saveError} setSaveError={setSaveError}
        facilityOptions={facilityOptions}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Save Changes"
        hasChanges={hasChanges}
      />
    </ModalShell>
  );
};

// ─── BranchCard ───────────────────────────────────────────────────────────────

const BranchCard = ({ branch, index, onEdit }) => {
  const a = accent(index);

  return (
    <div
      className="group relative rounded-2xl p-5 transition-all duration-300 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = a.light;
        e.currentTarget.style.border      = `1px solid ${a.border}`;
        e.currentTarget.style.transform   = 'translateY(-3px)';
        e.currentTarget.style.boxShadow   = `0 16px 40px ${a.glow}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.border      = '1px solid rgba(255,255,255,0.07)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Gradient top stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: a.gradient }} />

      {/* Top row: badge + edit button */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
          style={{ background: a.gradient, boxShadow: `0 4px 14px ${a.glow}` }}>
          {nameInitials(branch.name)}
        </div>

        <button
          onClick={() => onEdit(branch)}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.28)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      {/* Content */}
      <div className="space-y-2 flex-1">
        <h3 className="font-bold text-white text-base leading-tight">{branch.name}</h3>

        {/* Address */}
        <div className="flex items-start gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mt-0.5 shrink-0"
            style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {branch.address}
          </p>
        </div>

        {/* Facility pill */}
        {branch.facility && (
          <div className="flex items-center gap-1.5 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0"
              style={{ color: a.tagText }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full truncate max-w-45"
              style={{ background: a.tag, color: a.tagText, border: `1px solid ${a.border}` }}
              title={branch.facility.name}
            >
              {branch.facility.name}
            </span>
          </div>
        )}
      </div>

      {/* Footer: created date + id */}
      <div className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Added {fmt(branch.created_at)}
        </p>
        <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {branch.id?.slice(0, 8)}…
        </p>
      </div>
    </div>
  );
};

// ─── Main Branches page ───────────────────────────────────────────────────────

const Branches = () => {
  const {
    branches, loading, error,
    saving, saveError, setSaveError,
    createBranch, updateBranch, refetch,
  } = useBranches();

  const { facilities, loading: facilitiesLoading } = useFacilities();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch]         = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');

  // Build options for the facility selector inside modals
  const facilityOptions = facilities.map(f => ({
    value: String(f.id),
    label: f.name,
  }));

  // Filtered view
  const filtered = branches.filter(b => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.name?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q) ||
      b.facility?.name?.toLowerCase().includes(q);
    const matchFacility =
      facilityFilter === 'all' || String(b.facility?.id) === facilityFilter;
    return matchSearch && matchFacility;
  });

  const closeCreate = () => { setShowCreate(false); setSaveError(null); };
  const closeEdit   = () => { setEditTarget(null);  setSaveError(null); };

  return (
    <DashboardLayout pageTitle="Branches" pageSubtitle="Manage branch locations under each facility">
      <div className="space-y-6 animate-slide-up">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full sm:w-auto">

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <svg xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search branches…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; e.target.style.background = 'rgba(124,58,237,0.06)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              />
            </div>

            {/* Filter by facility */}
            {facilities.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFacilityFilter('all')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={facilityFilter === 'all' ? {
                    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  All Facilities
                </button>
                {facilities.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFacilityFilter(String(f.id))}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all truncate max-w-40"
                    style={facilityFilter === String(f.id) ? {
                      background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                    title={f.name}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}

            {/* Count */}
            {!loading && (
              <span className="text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
                {filtered.length} {filtered.length === 1 ? 'branch' : 'branches'}
              </span>
            )}
          </div>

          <Button variant="primary" size="md" onClick={() => setShowCreate(true)} className="w-full sm:w-auto shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Branch
          </Button>
        </div>

        {/* ── Summary stats ── */}
        {!loading && !error && branches.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Branches', value: branches.length,                            gradient: 'linear-gradient(90deg,#7c3aed,#a855f7)', glow: 'rgba(124,58,237,0.25)' },
              { label: 'Facilities',     value: new Set(branches.map(b => b.facility?.id)).size, gradient: 'linear-gradient(90deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.25)'  },
              { label: 'Filtered',       value: filtered.length,                            gradient: 'linear-gradient(90deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.25)' },
              { label: 'This Month',     value: branches.filter(b => {
                  const d = new Date(b.created_at);
                  const n = new Date();
                  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
                }).length,                                                                   gradient: 'linear-gradient(90deg,#f59e0b,#f97316)', glow: 'rgba(245,158,11,0.25)' },
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

        {/* ── Loading ── */}
        {(loading || facilitiesLoading) && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-2xl animate-pulse"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
            <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Loading branches…
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

        {/* ── No facilities warning (can't create branches without one) ── */}
        {!loading && !error && branches.length === 0 && facilities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}>
              🏢
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">No facilities yet</p>
              <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                You need to create at least one facility before adding branches.
              </p>
            </div>
            <Button variant="ghost" size="md" onClick={() => window.location.href = '/manager/facilities'}>
              Go to Facilities →
            </Button>
          </div>
        )}

        {/* ── Empty branches (but facilities exist) ── */}
        {!loading && !error && branches.length === 0 && facilities.length > 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}>
              🌿
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">No branches yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Add your first branch location to get started
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
              Add First Branch
            </Button>
          </div>
        )}

        {/* ── No search results ── */}
        {!loading && !error && branches.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl">🔍</div>
            <p className="text-sm font-semibold text-white">
              No branches match your{search ? ` search "${search}"` : ' filters'}
            </p>
            <button
              onClick={() => { setSearch(''); setFacilityFilter('all'); }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Cards grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((branch, index) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                index={index}
                onEdit={setEditTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateBranchModal
          onClose={closeCreate}
          onSuccess={() => { setShowCreate(false); setSaveError(null); }}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          createBranch={createBranch}
          facilityOptions={facilityOptions}
        />
      )}

      {editTarget && (
        <EditBranchModal
          branch={editTarget}
          onClose={closeEdit}
          onSuccess={() => { setEditTarget(null); setSaveError(null); }}
          saving={saving}
          saveError={saveError}
          setSaveError={setSaveError}
          updateBranch={updateBranch}
          facilityOptions={facilityOptions}
        />
      )}
    </DashboardLayout>
  );
};

export default Branches;