import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import {
  DarkInput, DarkSelect, ModalShell, ErrorBanner,
} from '../../components/ui/FormComponents';
import useUpdates from '../../hooks/useUpdates';
import useResidents from '../../hooks/useResidents';

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const fmt = iso =>
  iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : '—';

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'  },
  approved: { label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  declined: { label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'   },
  updated:  { label: 'Updated',  color: '#60a5fa', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)'  },
};

const TYPE_META = {
  weekly:  { label: 'Weekly',  color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)' },
  monthly: { label: 'Monthly', color: '#f9a8d4', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.3)' },
};

const Pill = ({ meta }) => (
  <span className="text-xs px-2.5 py-1 rounded-full font-bold"
    style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
    {meta.label}
  </span>
);

// ─── Create Update Modal ──────────────────────────────────────────────────────

const CreateModal = ({ residents, onClose, onSuccess, saving, saveError, setSaveError, create }) => {
  const [form, setForm] = useState({
    resident_id: '',
    date_taken:  today(),
    type:        '',
    weight:      '',
    notes:       '',
    reason_filled_late: '',
  });
  const [errs, setErrs] = useState({});

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrs(p => ({ ...p, [k]: undefined }));
    if (saveError) setSaveError(null);
  };

  // Detect late submission (not today)
  const isLate = form.date_taken && form.date_taken !== today();

  const validate = () => {
    const e = {};
    if (!form.resident_id)  e.resident_id = 'Select a resident';
    if (!form.date_taken)   e.date_taken  = 'Select a date';
    if (!form.type)         e.type        = 'Select update type';
    if (!form.weight || isNaN(Number(form.weight)) || Number(form.weight) <= 0)
      e.weight = 'Enter a valid weight (kg)';
    if (!form.notes.trim()) e.notes       = 'Notes are required';
    if (isLate && !form.reason_filled_late.trim())
      e.reason_filled_late = 'Please explain why this entry is late';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const result = await create({
      resident_id:        form.resident_id,
      date_taken:         form.date_taken,
      type:               form.type,
      weight:             Number(form.weight),
      notes:              form.notes.trim(),
      ...(isLate ? { reason_filled_late: form.reason_filled_late.trim() } : {}),
    });
    if (result.success) onSuccess();
  };

  const residentOptions = residents.map(r => ({
    value: String(r.id),
    label: `${r.first_name} ${r.last_name}`,
  }));

  return (
    <ModalShell title="New Resident Update" subtitle="Submit a weekly or monthly update" onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        <DarkSelect label="Resident *" value={form.resident_id} onChange={set('resident_id')}
          options={residentOptions} placeholder="Select resident…" error={errs.resident_id} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Date *</label>
            <input type="date" value={form.date_taken} max={today()}
              onChange={set('date_taken')}
              className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: errs.date_taken ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
              onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
              onBlur={e => { e.target.style.border = errs.date_taken ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
            />
            {errs.date_taken && <p className="text-xs text-red-400">{errs.date_taken}</p>}
          </div>
          <DarkSelect label="Type *" value={form.type} onChange={set('type')}
            options={[{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]}
            placeholder="Select type…" error={errs.type} />
        </div>

        <DarkInput label="Weight (kg) *" type="number" step="0.1" min="0"
          placeholder="e.g. 68.5" value={form.weight} onChange={set('weight')} error={errs.weight} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Notes *</label>
          <textarea rows={4} value={form.notes} onChange={set('notes')}
            placeholder="Describe the resident's condition, behaviour, and any notable observations…"
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: errs.notes ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = errs.notes ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
          />
          {errs.notes && <p className="text-xs text-red-400">{errs.notes}</p>}
        </div>

        {/* Late entry reason — only shown if date is not today */}
        {isLate && (
          <div className="space-y-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <p className="text-xs text-amber-300 font-semibold">
              ⚠ This entry is for a past date. A reason is required.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Reason for Late Entry *
              </label>
              <textarea rows={2} value={form.reason_filled_late} onChange={set('reason_filled_late')}
                placeholder="Why was this update not submitted on time?"
                className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition-all resize-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: errs.reason_filled_late ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
                onBlur={e => { e.target.style.border = errs.reason_filled_late ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)'; }}
              />
              {errs.reason_filled_late && <p className="text-xs text-red-400">{errs.reason_filled_late}</p>}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Submitting…' : 'Submit Update'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Update card (caregiver view) ─────────────────────────────────────────────

const UpdateCard = ({ update, residentMap }) => {
  const [expanded, setExpanded] = useState(false);
  const statusMeta = STATUS_META[update.status] ?? STATUS_META.pending;
  const typeMeta   = TYPE_META[update.type]     ?? TYPE_META.weekly;
  const resName    = update.resident_name ?? residentMap[String(update.resident)] ?? 'Resident';
  const deviation  = update.weight_deviation;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header row */}
      <button type="button"
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        {/* Date pill */}
        <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <p className="text-xs font-bold text-violet-400 leading-none">
            {new Date(update.date_taken + 'T00:00:00').toLocaleDateString('en-KE', { month: 'short' }).toUpperCase()}
          </p>
          <p className="text-base font-black text-white leading-none mt-0.5">
            {new Date(update.date_taken + 'T00:00:00').getDate()}
          </p>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{resName}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Pill meta={typeMeta} />
            <Pill meta={statusMeta} />
          </div>
        </div>
        {/* Weight */}
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-white">{update.weight} kg</p>
          {deviation !== null && deviation !== undefined && (
            <p className="text-xs font-semibold"
              style={{ color: deviation > 0 ? '#34d399' : deviation < 0 ? '#f87171' : 'rgba(255,255,255,0.35)' }}>
              {deviation > 0 ? '+' : ''}{Number(deviation).toFixed(1)} kg
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
        <div className="px-5 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              ['Date',       fmt(update.date_taken)],
              ['Submitted',  fmt(update.created_at?.slice(0,10))],
              ['Caregiver',  update.care_giver ?? '—'],
              ['Status',     statusMeta.label],
            ].map(([l, v]) => (
              <div key={l} className="px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</p>
                <p className="text-sm font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>
          <div className="px-3 py-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Notes</p>
            <p className="text-sm text-white/80 leading-relaxed">{update.notes}</p>
          </div>
          {update.decline_reason && (
            <div className="px-3 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 text-red-400">Decline Reason</p>
              <p className="text-sm text-red-300">{update.decline_reason}</p>
            </div>
          )}
          {update.reason_filled_late && (
            <div className="px-3 py-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 text-amber-400">Late Entry Reason</p>
              <p className="text-sm text-amber-300">{update.reason_filled_late}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main caregiver Updates page ──────────────────────────────────────────────

const TABS = [
  { id: 'submit',  label: 'New Update', icon: '📝', desc: 'Submit a weekly or monthly resident update' },
  { id: 'history', label: 'My Updates', icon: '📋', desc: 'View submitted updates and their status' },
];

const CaregiverUpdates = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter,   setTypeFilter]   = useState('all');

  const { residents }                                       = useResidents();
  const { updates, loading, error, saving, saveError, setSaveError, create, refetch } = useUpdates();

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );

  const filtered = useMemo(() =>
    updates.filter(u =>
      (statusFilter === 'all' || u.status === statusFilter) &&
      (typeFilter   === 'all' || u.type   === typeFilter)
    ),
    [updates, statusFilter, typeFilter]
  );

  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Resident Updates" pageSubtitle="Submit and track weekly and monthly updates">
      <div className="space-y-5 animate-slide-up">
        {/* Tab bar */}
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{current.icon}</span>
            <div>
              <h2 className="text-base font-black text-white">{current.label}</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{current.desc}</p>
            </div>
          </div>
          {activeTab === 'history' && (
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Update
            </Button>
          )}
        </div>

        {/* Submit tab — just opens the modal directly */}
        {activeTab === 'submit' && (
          <div className="flex flex-col items-center justify-center py-16 gap-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-5xl">📝</div>
            <div className="text-center">
              <p className="text-base font-black text-white mb-2">Ready to submit an update?</p>
              <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Record the resident's weight, condition notes, and any observations for the week or month.
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
              Start New Update
            </Button>
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              {/* Status filter */}
              {['all', 'pending', 'approved', 'declined', 'updated'].map(f => {
                const meta = STATUS_META[f];
                return (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                    style={statusFilter === f ? {
                      background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                      color: meta ? meta.color : '#fff',
                      border: `1px solid ${meta ? meta.border : 'transparent'}`,
                    } : {
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                    }}>
                    {f === 'all' ? 'All Status' : meta.label}
                  </button>
                );
              })}
              <div className="w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
              {/* Type filter */}
              {['all', 'weekly', 'monthly'].map(f => {
                const meta = TYPE_META[f];
                return (
                  <button key={f} onClick={() => setTypeFilter(f)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                    style={typeFilter === f ? {
                      background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                      color: meta ? meta.color : '#fff',
                      border: `1px solid ${meta ? meta.border : 'transparent'}`,
                    } : {
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                    }}>
                    {f === 'all' ? 'All Types' : (meta?.label ?? f)}
                  </button>
                );
              })}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</p>
              </div>
            )}
            {!loading && error && <p className="text-red-400 text-sm text-center py-8">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-12 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-3xl mb-3">📋</p>
                <p className="text-white/50 text-sm">
                  {updates.length === 0 ? "You haven't submitted any updates yet." : 'No updates match your filters.'}
                </p>
              </div>
            )}
            {!loading && filtered.map(u => (
              <UpdateCard key={u.id} update={u} residentMap={residentMap} />
            ))}
          </div>
        )}

        {/* Create modal */}
        {showModal && (
          <CreateModal
            residents={residents}
            onClose={() => { setShowModal(false); setSaveError(null); }}
            onSuccess={() => { setShowModal(false); setSaveError(null); setActiveTab('history'); refetch(); }}
            saving={saving} saveError={saveError} setSaveError={setSaveError}
            create={create}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CaregiverUpdates;