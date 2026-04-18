import { useState, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Button from '../../components/ui/Button';
import { DarkInput, DarkSelect, ModalShell, ErrorBanner } from '../../components/ui/FormComponents';
import useGroceries from '../../hooks/useGroceries';
import useBranches from '../../hooks/useBranches';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:   { label: 'Pending',   color: '#fbbf24', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  icon: '⏳' },
  approved:  { label: 'Approved',  color: '#34d399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  icon: '✅' },
  declined:  { label: 'Declined',  color: '#f87171', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   icon: '❌' },
  fulfilled: { label: 'Fulfilled', color: '#a78bfa', bg: 'rgba(124,58,237,0.15)',  border: 'rgba(124,58,237,0.3)',  icon: '📦' },
};

const fmt = iso =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ─── Item row editor ──────────────────────────────────────────────────────────

const ItemRow = ({ item, index, onChange, onRemove, isOnly }) => (
  <div className="flex gap-2 items-start">
    <div className="flex-1 grid grid-cols-12 gap-2">
      {/* Name */}
      <div className="col-span-5">
        <input type="text" placeholder="Item name *" value={item.name}
          onChange={e => onChange(index, 'name', e.target.value)}
          className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: !item.name.trim() && item._touched ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
          onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
          onBlur={e => {
            onChange(index, '_touched', true);
            e.target.style.border = !item.name.trim() ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.12)';
          }}
        />
      </div>
      {/* Quantity */}
      <div className="col-span-2">
        <input type="number" min="1" placeholder="Qty *" value={item.quantity}
          onChange={e => onChange(index, 'quantity', e.target.value)}
          className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
          onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
          onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
        />
      </div>
      {/* Particulars */}
      <div className="col-span-5">
        <input type="text" placeholder="Notes / brand (optional)" value={item.particulars}
          onChange={e => onChange(index, 'particulars', e.target.value)}
          className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
          onFocus={e => { e.target.style.border = '1px solid rgba(124,58,237,0.55)'; }}
          onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.12)'; }}
        />
      </div>
    </div>
    {/* Remove */}
    <button type="button" disabled={isOnly} onClick={() => onRemove(index)}
      className="w-8 h-8 mt-0.5 rounded-lg flex items-center justify-center shrink-0 transition-all text-sm"
      style={{ background: isOnly ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.12)', color: isOnly ? 'rgba(255,255,255,0.15)' : '#f87171', border: isOnly ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(239,68,68,0.25)', cursor: isOnly ? 'not-allowed' : 'pointer' }}>
      ✕
    </button>
  </div>
);

// ─── Create Request Modal ─────────────────────────────────────────────────────

const BLANK_ITEM = () => ({ name: '', quantity: 1, particulars: '', _touched: false });

const CreateModal = ({ branches, onClose, onSuccess, saving, saveError, setSaveError, create }) => {
  const [branchId, setBranchId] = useState('');
  const [items, setItems]       = useState([BLANK_ITEM()]);
  const [errs,  setErrs]        = useState({});

  const updateItem = (i, field, val) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const addItem    = () => setItems(p => [...p, BLANK_ITEM()]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};
    if (!branchId) e.branch = 'Select a branch';
    const touched = items.map(it => ({ ...it, _touched: true }));
    setItems(touched);
    const badItems = items.some(it => !it.name.trim() || !it.quantity || Number(it.quantity) < 1);
    if (badItems) e.items = 'All items need a name and quantity ≥ 1';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const payload = {
      branch_id: branchId,
      items: items.map(({ name, quantity, particulars }) => ({
        name: name.trim(),
        quantity: Number(quantity),
        ...(particulars.trim() ? { particulars: particulars.trim() } : {}),
      })),
    };
    const result = await create(payload);
    if (result.success) onSuccess();
  };

  const branchOptions = branches.map(b => ({ value: String(b.id), label: b.name }));

  return (
    <ModalShell title="New Grocery Request" subtitle="Add items you need and submit for manager approval" onClose={onClose}>
      <div className="space-y-5">
        <ErrorBanner message={saveError} />

        <DarkSelect label="Branch *" value={branchId}
          onChange={e => { setBranchId(e.target.value); setErrs(p => ({ ...p, branch: undefined })); if (saveError) setSaveError(null); }}
          options={branchOptions} placeholder="Select branch…" error={errs.branch} />

        {/* Items builder */}
        <div className="space-y-3">
          {/* Column labels */}
          <div className="grid grid-cols-12 gap-2 pl-0 pr-10 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            <div className="col-span-5">Item Name</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-5">Notes / Brand</div>
          </div>

          {items.map((item, i) => (
            <ItemRow key={i} item={item} index={i}
              onChange={updateItem} onRemove={removeItem} isOnly={items.length === 1} />
          ))}

          {errs.items && <p className="text-xs text-red-400">{errs.items}</p>}

          <button type="button" onClick={addItem}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        {/* Item count summary */}
        {items.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-lg">🛒</span>
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} ·{' '}
              {items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)} units total
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" size="md" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={handleSubmit}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

// ─── Request card ─────────────────────────────────────────────────────────────

const RequestCard = ({ req }) => {
  const [expanded, setExpanded] = useState(false);
  const meta     = STATUS_META[req.status] ?? STATUS_META.pending;
  const items    = req.items ?? [];
  const totalQty = items.reduce((s, it) => s + (it.quantity || 0), 0);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <button type="button"
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all"
        onClick={() => setExpanded(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
          {meta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">
              {items.length} item{items.length !== 1 ? 's' : ''}
              <span className="text-xs font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                · {totalQty} units
              </span>
            </p>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
              {meta.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Submitted {fmt(req.created_at?.slice(0, 10))}
          </p>
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 transition-transform"
          style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Items table */}
          <div className="rounded-xl overflow-hidden mt-3"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-5">Notes</div>
            </div>
            {items.map((it, i) => (
              <div key={it.id ?? i}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm items-center"
                style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                <div className="col-span-5 font-semibold text-white">{it.name}</div>
                <div className="col-span-2 text-center">
                  <span className="text-xs font-black px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>
                    ×{it.quantity}
                  </span>
                </div>
                <div className="col-span-5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {it.particulars || '—'}
                </div>
              </div>
            ))}
          </div>

          {req.status === 'declined' && req.decline_reason && (
            <div className="px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1 text-red-400">Decline Reason</p>
              <p className="text-sm text-red-300">{req.decline_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const CaregiverGroceries = () => {
  const [showModal,    setShowModal]    = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { requests, loading, error, saving, saveError, setSaveError, create, refetch } = useGroceries();
  const { branches } = useBranches();

  const filtered = useMemo(() =>
    statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter),
    [requests, statusFilter]
  );

  const counts = useMemo(() => ({
    pending:   requests.filter(r => r.status === 'pending').length,
    approved:  requests.filter(r => r.status === 'approved').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
  }), [requests]);

  return (
    <DashboardLayout pageTitle="Grocery Requests" pageSubtitle="Submit and track grocery and supply requests">
      <div className="space-y-5 animate-slide-up">

        <div className="flex items-center justify-between">
          <div>
            {counts.pending > 0 && (
              <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                {counts.pending} pending approval
              </p>
            )}
          </div>
          <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </Button>
        </div>

        {/* Summary cards */}
        {requests.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pending',   value: counts.pending,   meta: STATUS_META.pending,   filter: 'pending'   },
              { label: 'Approved',  value: counts.approved,  meta: STATUS_META.approved,  filter: 'approved'  },
              { label: 'Fulfilled', value: counts.fulfilled, meta: STATUS_META.fulfilled, filter: 'fulfilled' },
            ].map(s => (
              <div key={s.label}
                className="relative rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: statusFilter === s.filter ? `1px solid ${s.meta.border}` : '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setStatusFilter(statusFilter === s.filter ? 'all' : s.filter)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 24px ${s.meta.bg}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${s.meta.color},${s.meta.color}60)` }} />
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs mt-0.5 flex items-center gap-1.5">
                  <span>{s.meta.icon}</span>
                  <span style={{ color: s.meta.color }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'declined', 'fulfilled'].map(f => {
            const meta = STATUS_META[f];
            return (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={statusFilter === f ? {
                  background: meta ? meta.bg : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: meta ? meta.color : '#fff', border: `1px solid ${meta ? meta.border : 'transparent'}`,
                } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                {f === 'all' ? 'All' : (meta?.label ?? f)}
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

        {!loading && !error && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-5 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-5xl">🛒</span>
            <div>
              <p className="text-base font-black text-white mb-2">No requests yet</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Submit a grocery request and it will appear here for manager approval.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowModal(true)}>New Request</Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && requests.length > 0 && (
          <div className="text-center py-10 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-white/50 text-sm">No {STATUS_META[statusFilter]?.label ?? ''} requests.</p>
          </div>
        )}

        {!loading && filtered.map(req => <RequestCard key={req.id} req={req} />)}
      </div>

      {showModal && (
        <CreateModal
          branches={branches}
          onClose={() => { setShowModal(false); setSaveError(null); }}
          onSuccess={() => { setShowModal(false); setSaveError(null); refetch(); }}
          saving={saving} saveError={saveError} setSaveError={setSaveError}
          create={create}
        />
      )}
    </DashboardLayout>
  );
};

export default CaregiverGroceries;