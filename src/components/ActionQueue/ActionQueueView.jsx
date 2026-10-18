import React, { useEffect, useMemo, useState } from 'react';
import { Inbox, ShieldCheck, TrendingDown, Wallet, SearchX, Zap, RotateCw, Eye, AlertTriangle } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { api } from '../../api';
import { Button, Card, Modal, ScoreBar, ACTION, TIER, actionLabel, channelLabel, peso } from '../ui';

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Needs review' },
  { id: 'HIGH', label: 'High' },
  { id: 'MEDIUM', label: 'Medium' },
  { id: 'LOW', label: 'Low' },
];

const StatCard = ({ icon: Icon, tone, value, label }) => (
  <div className="bg-white rounded-md shadow-card p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <div className="font-heading font-medium text-[22px] text-ink leading-tight">{value}</div>
      <div className="text-[13px] text-muted">{label}</div>
    </div>
  </div>
);

const StatusPill = ({ decision }) => {
  if (decision.status === 'PENDING') return <span className="text-xs text-muted">Pending</span>;
  const overridden = decision.status === 'OVERRIDDEN';
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${overridden ? 'bg-medium-soft text-medium-text' : 'bg-low-soft text-low-text'}`}>
      {overridden ? 'Overridden' : 'Accepted'}: {actionLabel(decision.action)}
    </span>
  );
};

const place = (order) => {
  const p = order.risk_assessment?.parsed_address;
  return [p?.city, p?.province].filter(Boolean).join(', ') || order.raw_address;
};

export const ActionQueueView = () => {
  const {
    orders,
    loading,
    filteredOrders,
    selectedOrderId,
    activeRiskFilter,
    setActiveRiskFilter,
    sortBy,
    setSortBy,
    setSimulationModalOpen,
    isSimulating,
    openOrder,
    bulkDecide,
    searchQuery,
    setSearchQuery,
  } = useOrders();

  const [headline, setHeadline] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkAction, setBulkAction] = useState(null); // null, 'ACCEPT' or 'HOLD'
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.dashboard().then(setHeadline).catch(() => setHeadline(null));
  }, []);

  // Forget selections that the current filter hides.
  useEffect(() => {
    setSelected((prev) => new Set([...prev].filter((id) => filteredOrders.some((o) => o.id === id))));
  }, [filteredOrders]);

  const counts = useMemo(() => ({
    ALL: orders.length,
    PENDING: orders.filter((o) => o.decision.status === 'PENDING').length,
    HIGH: orders.filter((o) => o.risk_assessment.risk_tier === 'HIGH').length,
    MEDIUM: orders.filter((o) => o.risk_assessment.risk_tier === 'MEDIUM').length,
    LOW: orders.filter((o) => o.risk_assessment.risk_tier === 'LOW').length,
  }), [orders]);

  const bt = headline?.backtest;
  const held = bt?.if_high_orders_were_held;

  const allChecked = filteredOrders.length > 0 && filteredOrders.every((o) => selected.has(o.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(filteredOrders.map((o) => o.id)));
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const chosen = orders.filter((o) => selected.has(o.id));
  const chosenNames = chosen.slice(0, 3).map((o) => o.customer.name).join(', ') + (chosen.length > 3 ? ` and ${chosen.length - 3} more` : '');
  const chosenCod = chosen.reduce((sum, o) => sum + Number(o.amount || 0), 0);

  const runBulk = async () => {
    setSaving(true);
    await bulkDecide([...selected], bulkAction === 'HOLD' ? 'HOLD' : null);
    setSaving(false);
    setBulkAction(null);
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading font-medium text-2xl text-ink">Action queue</h1>
          <p className="mt-1">
            {counts.PENDING} {counts.PENDING === 1 ? 'order is' : 'orders are'} waiting for a decision before the waybill is printed.
          </p>
        </div>
        <Button onClick={() => setSimulationModalOpen(true)} disabled={isSimulating}>
          {isSimulating ? <RotateCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {isSimulating ? 'Scoring with Gemini…' : 'Score a new order'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={Inbox} tone="bg-primary-soft text-primary" value={counts.PENDING} label="Waiting for review" />
        <StatCard icon={ShieldCheck} tone="bg-low-soft text-low-text" value={held ? `${held.share_of_all_rts_caught_pct}%` : '—'} label="Returns caught in backtest" />
        <StatCard icon={TrendingDown} tone="bg-medium-soft text-medium-text" value={held ? `${bt.overall_rts_rate}% → ${held.rts_rate_of_orders_shipped}%` : '—'} label="RTS on shipped orders" />
        <StatCard icon={Wallet} tone="bg-high-soft text-high-text" value={bt ? peso(bt.extrapolated_to_all_orders.shipping_saved_php) : '—'} label="Shipping fees saved" />
      </div>

      <Card bodyClass="">
        {/* The bulk bar takes the filter row's place at the same height, so the rows never shift under the cursor. */}
        {selected.size > 0 ? (
          <div className="min-h-[69px] px-5 py-3 bg-primary text-white flex flex-wrap items-center gap-3 text-sm rounded-t-md">
            <span className="font-medium">{selected.size} selected</span>
            <button onClick={() => setBulkAction('ACCEPT')} className="min-h-[36px] px-3 rounded bg-white text-primary font-medium hover:bg-primary-soft">
              Accept AI suggestions
            </button>
            <button onClick={() => setBulkAction('HOLD')} className="min-h-[36px] px-3 rounded border border-white/60 hover:bg-white/10">
              Hold all
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto min-h-[36px] px-2 text-white/85 hover:text-white">
              Clear selection
            </button>
          </div>
        ) : (
        <div className="min-h-[69px] px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-line">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by risk">
            {FILTERS.map((f) => {
              const active = activeRiskFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveRiskFilter(f.id)}
                  aria-pressed={active}
                  className={`min-h-[36px] px-3 rounded text-sm border transition-colors ${
                    active ? 'border-primary bg-primary-soft text-primary font-medium' : 'border-line bg-white text-body hover:bg-subtle'
                  }`}
                >
                  {f.label} <span className="tabular-nums">{counts[f.id]}</span>
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-h-[36px] border border-line rounded px-2 bg-white text-ink focus:outline-none focus:border-primary"
            >
              <option value="RISK_DESC">Highest risk first</option>
              <option value="RISK_ASC">Lowest risk first</option>
              <option value="AMOUNT_DESC">Highest amount</option>
              <option value="DATE_DESC">Most recent</option>
            </select>
          </label>
        </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-subtle text-left text-xs text-ink">
                <th className="pl-5 pr-2 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all orders shown" className="w-4 h-4 accent-primary" />
                </th>
                <th className="px-3 py-3 font-semibold">Order</th>
                <th className="px-3 py-3 font-semibold">Buyer</th>
                <th className="px-3 py-3 font-semibold">Channel</th>
                <th className="px-3 py-3 font-semibold text-right">COD</th>
                <th className="px-3 py-3 font-semibold w-[200px]">Risk score</th>
                <th className="px-3 py-3 font-semibold">Suggested</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="pl-3 pr-5 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 && [0, 1, 2, 3, 4, 5].map((i) => (
                <tr key={`sk-${i}`} className="border-t" aria-hidden="true">
                  <td colSpan={9} className="px-5 py-4">
                    <div className="flex items-center gap-6 animate-pulse">
                      <div className="w-5 h-5 rounded bg-subtle" />
                      <div className="w-20 h-4 rounded bg-subtle" />
                      <div className="w-28 h-4 rounded bg-subtle" />
                      <div className="hidden md:block w-24 h-4 rounded bg-subtle" />
                      <div className="ml-auto w-40 h-2.5 rounded-full bg-subtle" />
                      <div className="w-20 h-4 rounded bg-subtle" />
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12">
                    <div className="flex flex-col items-center text-center gap-2">
                      <SearchX className="w-9 h-9 text-muted" />
                      <p className="font-medium text-ink">{searchQuery ? `No orders match “${searchQuery}”` : 'No orders in this filter'}</p>
                      <p className="text-muted">Search by order number, buyer initials, item, city or risk (for example “bacoor high”), pick another filter, or score a new order.</p>
                      {(searchQuery || activeRiskFilter !== 'ALL') && (
                        <button type="button" onClick={() => { setSearchQuery(''); setActiveRiskFilter('ALL'); }} className="mt-2 px-3 py-1.5 rounded bg-primary-soft text-primary font-medium hover:bg-primary hover:text-white transition-colors cursor-pointer">
                          Show all orders
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {filteredOrders.map((order) => {
                const a = order.risk_assessment;
                const act = ACTION[a.recommended_action];
                const isChecked = selected.has(order.id);
                return (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order.id)}
                    className={`border-t border-line cursor-pointer transition-colors ${
                      isChecked ? 'bg-primary-soft/60' : order.id === selectedOrderId ? 'bg-subtle' : 'hover:bg-subtle'
                    }`}
                  >
                    <td className="pl-5 pr-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggle(order.id)} aria-label={`Select order ${order.id}`} className="w-4 h-4 accent-primary" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-mono text-[13px] text-ink">#{order.id}</div>
                      <div className="text-xs text-muted">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink">{order.customer.name}</div>
                      <div className="text-xs text-muted truncate max-w-[220px]">{place(order)}</div>
                    </td>
                    <td className="px-3 py-3">{channelLabel(order.channel)}</td>
                    <td className="px-3 py-3 text-right font-medium text-ink tabular-nums">{peso(order.amount)}</td>
                    <td className="px-3 py-3"><ScoreBar score={a.risk_score} tier={a.risk_tier} /></td>
                    <td className={`px-3 py-3 font-medium ${TIER[act?.tier]?.text || ''}`}>
                      <span className="inline-flex items-center gap-1.5">
                        {a.confidence === 'LOW' && <AlertTriangle className="w-3.5 h-3.5" aria-label="Low confidence" />}
                        {actionLabel(a.recommended_action)}
                      </span>
                    </td>
                    <td className="px-3 py-3"><StatusPill decision={order.decision} /></td>
                    <td className="pl-3 pr-5 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openOrder(order.id); }}
                        aria-label={`Open order ${order.id}`}
                        className="p-2 rounded text-body hover:bg-line"
                      >
                        <Eye className="w-[18px] h-[18px]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 border-t border-line text-[13px] text-muted">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </Card>

      <Modal open={bulkAction !== null} onClose={() => !saving && setBulkAction(null)} labelledBy="bulk-title" role="alertdialog" maxWidth="max-w-md">
        <div className="px-7 pt-8 pb-7 text-center">
          <div className={`mx-auto mb-4 w-16 h-16 rounded-full border-[3px] flex items-center justify-center ${bulkAction === 'HOLD' ? 'border-high text-high-text' : 'border-primary text-primary'}`}>
            {bulkAction === 'HOLD' ? <AlertTriangle className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <h2 id="bulk-title" className="font-heading font-medium text-xl text-ink">
            {bulkAction === 'HOLD' ? `Hold ${selected.size} orders?` : `Accept ${selected.size} AI suggestions?`}
          </h2>
          <p className="mt-2 leading-relaxed">
            {bulkAction === 'HOLD'
              ? `${chosenNames} won't get waybills until you release them.`
              : `Each order gets the action Gemini suggested for it: ${chosenNames}.`}
            {' '}Total COD {peso(chosenCod)}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant={bulkAction === 'HOLD' ? 'danger' : 'primary'} onClick={runBulk} disabled={saving}>
              {saving && <RotateCw className="w-4 h-4 animate-spin" />}
              {bulkAction === 'HOLD' ? `Hold ${selected.size} orders` : `Accept ${selected.size} suggestions`}
            </Button>
            <Button variant="secondary" onClick={() => setBulkAction(null)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
