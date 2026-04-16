import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import useVitals from '../../hooks/useVitals';
import useResidents from '../../hooks/useResidents';
import {
  DarkInput, DarkSelect, ModalShell, ErrorBanner,
} from '../../components/ui/FormComponents';

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)'  },
  approved: { label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)'  },
  declined: { label: 'Declined', color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)'   },
  updated:  { label: 'Updated',  color: '#a78bfa', bg: 'rgba(124,58,237,0.15)',  border: 'rgba(124,58,237,0.3)'  },
};

const TABS = [
  { id: 'submit',  label: 'Record Vitals', icon: '❤️', desc: 'Submit a new vital reading for a resident' },
  { id: 'history', label: 'My Records',    icon: '📋', desc: 'View and manage your submitted vitals' },
];

// ─── Vital display card ───────────────────────────────────────────────────────

const VitalBadge = ({ label, value, unit = '', warn = false }) => (
  <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl"
    style={{
      background: warn ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
      border: warn ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
    }}>
    <p className="text-[10px] uppercase tracking-wider font-semibold"
      style={{ color: warn ? '#f87171' : 'rgba(255,255,255,0.4)' }}>{label}</p>
    <p className="text-sm font-black" style={{ color: warn ? '#fca5a5' : '#ffffff' }}>
      {value || '—'}{unit && value ? ` ${unit}` : ''}
    </p>
  </div>
);

// ─── Submit / Edit Modal ──────────────────────────────────────────────────────

const VitalFormModal = ({ vital, residents, onClose, onSuccess, saving, saveError, setSaveError, onSave }) => {
  const isEdit = !!vital;

  const [form, setForm] = useState({
    resident:          vital?.resident ?? '',
    blood_pressure:    vital?.blood_pressure ?? '',
    temperature:       vital?.temperature ?? '',
    pulse:             vital?.pulse ?? '',
    oxygen_saturation: vital?.oxygen_saturation ?? '',
    pain:              vital?.pain ?? '',
    date_taken:        vital?.date_taken ?? today(),
    reason_edited:     '',
  });
  const [errs, setErrs] = useState({});

  const residentOptions = residents.map(r => ({
    value: String(r.id),
    label: `${r.first_name} ${r.last_name}`,
  }));

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrs(p => ({ ...p, [k]: undefined }));
    if (saveError) setSaveError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.resident)          e.resident          = 'Select a resident';
    if (!form.blood_pressure.trim()) e.blood_pressure = 'Required (e.g. 120/80)';
    if (!form.temperature)       e.temperature       = 'Required';
    if (!form.pulse)             e.pulse             = 'Required';
    if (!form.oxygen_saturation) e.oxygen_saturation = 'Required';
    if (!form.date_taken)        e.date_taken        = 'Required';
    if (isEdit && !form.reason_edited.trim()) e.reason_edited = 'Please explain what was corrected';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }

    const payload = {
      resident:          form.resident,
      blood_pressure:    form.blood_pressure.trim(),
      temperature:       parseFloat(form.temperature),
      pulse:             parseFloat(form.pulse),
      oxygen_saturation: parseFloat(form.oxygen_saturation),
      pain:              form.pain.trim() || null,
      date_taken:        form.date_taken,
      ...(isEdit ? { reason_edited: form.reason_edited.trim() } : {}),
    };

    const result = await onSave(payload);
    if (result.success) onSuccess();
  };

  return (
    <ModalShell
      title={isEdit ? 'Edit Vital Record' : 'Record Vitals'}
      subtitle={isEdit ? 'Correct and resubmit — edit reason required' : 'Enter today\'s vital signs for a resident'}
      onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={saveError} />

        {!isEdit && (
          <DarkSelect label="Resident *" value={form.resident} onChange={set('resident')}
            options={residentOptions} placeholder="Select resident…" error={errs.resident} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <DarkInput label="Date *" type="date" value={form.date_taken} max={today()}
            onChange={set('date_taken')} error={errs.date_taken} />
          <DarkInput label="Blood Pressure *" placeholder="e.g. 120/80" value={form.blood_pressure}
            onChange={set('blood_pressure')} error={errs.blood_pressure} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <DarkInput label="Temperature °F *" type="number" step="0.1" placeholder="98.6"
            value={form.temperature} onChange={set('temperature')} error={errs.temperature} />
          <DarkInput label="Pulse (bpm) *" type="number" placeholder="72"
            value={form.pulse} onChange={set('pulse')} error={errs.pulse} />
          <DarkInput label="O₂ Saturation % *" type="number" step="0.1" placeholder="98"
            value={form.oxygen_saturation} onChange={set('oxygen_saturation')} error={errs.oxygen_saturation} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Pain / Notes <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea rows={2} value={form.pain} onChange={set('pain')} placeholder="Describe any pain or relevant observations…"
            className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none resize-none transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', colorScheme: 'dark' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }} />
        </div>

        {isEdit && (
          <DarkInput label="Reason for Edit *" placeholder="What was corrected and why?"
            value={form.reason_edited} onChange={set('reason_edited')} error={errs.reason_edited}
            hint="This is required when updating a record" />
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={submit}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Vitals'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Submit Tab ───────────────────────────────────────────────────────────────

const SubmitTab = ({ residents, createVital, saving, saveError, setSaveError }) => {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>✅</div>
      <div>
        <p className="text-lg font-black text-white mb-1">Vitals Submitted!</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>The record has been sent for manager review.</p>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" size="md" onClick={() => setSubmitted(false)}>Submit Another</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Quick-action card */}
      <div className="rounded-2xl p-6 text-center space-y-3"
        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="text-4xl">❤️</div>
        <div>
          <p className="text-base font-black text-white">Record a Vital Reading</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Blood pressure, temperature, pulse, and oxygen saturation
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
          + New Vital Reading
        </Button>
      </div>

      {/* Reference ranges */}
      <div className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}>Normal Reference Ranges</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            ['Blood Pressure', '< 120/80 mmHg'],
            ['Temperature',    '97–99 °F'],
            ['Pulse',          '60–100 bpm'],
            ['O₂ Saturation',  '95–100 %'],
          ].map(([label, range]) => (
            <div key={label} className="px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-bold text-white">{label}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>{range}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <VitalFormModal residents={residents} vital={null}
          onClose={() => { setShowModal(false); setSaveError(null); }}
          onSuccess={() => { setShowModal(false); setSubmitted(true); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          onSave={createVital} />
      )}
    </div>
  );
};

// ─── History Tab ──────────────────────────────────────────────────────────────

const HistoryTab = ({ vitals, loading, error, refetch, residents, updateVital, saving, saveError, setSaveError }) => {
  const [editTarget, setEditTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const residentMap = useMemo(() =>
    Object.fromEntries(residents.map(r => [String(r.id), `${r.first_name} ${r.last_name}`])),
    [residents]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return vitals.filter(v => {
      const name = v.resident_name ?? residentMap[String(v.resident)] ?? '';
      const matchSearch = !q || name.toLowerCase().includes(q) || v.date_taken?.includes(q);
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vitals, search, statusFilter, residentMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by resident or date…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.5)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; }} />
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap">
          {['all', 'pending', 'approved', 'declined', 'updated'].map(f => {
            const meta = STATUS_META[f];
            return (
              <button key={f} onClick={() => { setStatusFilter(f); setPage(0); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize"
                style={statusFilter === f
                  ? { background: meta?.bg ?? 'linear-gradient(135deg,#7c3aed,#a855f7)', color: meta?.color ?? '#fff', border: `1px solid ${meta?.border ?? 'transparent'}` }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                {f === 'all' ? 'All' : meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }} />
          <p className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading vitals…</p>
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-10">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={refetch} className="mt-3">Retry</Button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="text-5xl">📋</div>
          <p className="text-base font-bold text-white">
            {search || statusFilter !== 'all' ? 'No records match' : 'No vital records yet'}
          </p>
        </div>
      )}

      {!loading && !error && pageItems.length > 0 && (
        <>
          <div className="space-y-3">
            {pageItems.map(v => {
              const meta = STATUS_META[v.status] ?? STATUS_META.pending;
              const name = v.resident_name ?? residentMap[String(v.resident)] ?? 'Resident';
              const canEdit = v.status === 'pending' || v.status === 'declined';
              return (
                <div key={v.id} className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {/* Header row */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                        style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)' }}>❤️</div>
                      <div>
                        <p className="text-sm font-bold text-white">{name}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{fmt(v.date_taken)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => setEditTarget(v)}>Edit</Button>
                      )}
                    </div>
                  </div>
                  {/* Vitals grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
                    <VitalBadge label="Blood Pressure" value={v.blood_pressure} />
                    <VitalBadge label="Temperature"    value={v.temperature}    unit="°F" />
                    <VitalBadge label="Pulse"          value={v.pulse}          unit="bpm" />
                    <VitalBadge label="O₂ Saturation"  value={v.oxygen_saturation} unit="%" />
                  </div>
                  {/* Decline reason */}
                  {v.status === 'declined' && v.decline_reason && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-red-400">
                        <span className="font-bold">Declined: </span>{v.decline_reason}
                      </p>
                    </div>
                  )}
                  {/* Pain/notes */}
                  {v.pain && (
                    <div className="px-4 pb-3">
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <span className="font-semibold text-white/60">Notes: </span>{v.pain}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-white">{page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {editTarget && (
        <VitalFormModal vital={editTarget} residents={residents}
          onClose={() => { setEditTarget(null); setSaveError(null); }}
          onSuccess={() => { setEditTarget(null); setSaveError(null); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          onSave={(payload) => updateVital(editTarget.id, payload)} />
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CaregiverVitals = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const { residents }             = useResidents();
  const { vitals, loading, error, saving, saveError, setSaveError, createVital, updateVital, refetch } = useVitals();
  const current = TABS.find(t => t.id === activeTab);

  return (
    <DashboardLayout pageTitle="Vitals" pageSubtitle="Record and track resident vital signs">
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
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <div>
            <h2 className="text-base font-black text-white">{current.label}</h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{current.desc}</p>
          </div>
        </div>

        {activeTab === 'submit' && (
          <SubmitTab residents={residents} createVital={createVital}
            saving={saving} saveError={saveError} setSaveError={setSaveError} />
        )}
        {activeTab === 'history' && (
          <HistoryTab vitals={vitals} loading={loading} error={error} refetch={refetch}
            residents={residents} updateVital={updateVital}
            saving={saving} saveError={saveError} setSaveError={setSaveError} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CaregiverVitals;