import React, { useEffect, useState } from 'react';
import { X, Copy, Check, AlertTriangle, CheckCircle2, ShieldCheck, Pencil, Store, User } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { Button, Drawer, ACTION, TIER, actionLabel, channelLabel, peso } from '../ui';

const STAMP = {
  HIGH: 'border-high text-high-text',
  MEDIUM: 'border-medium text-medium-text',
  LOW: 'border-low text-low-text',
};

const humanize = (s) => (s || '').toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const WaybillSlip = ({ order }) => {
  const a = order.risk_assessment;
  const tier = ACTION[a.recommended_action]?.tier || a.risk_tier;
  return (
    <div className="border-2 border-ink rounded-md">
      <div className="flex justify-between px-3 py-2 border-b-2 border-ink font-mono text-[13px] text-ink">
        <span>#{order.id}</span>
        <span>{order.payment_type} {peso(order.amount)}</span>
      </div>
      <div className="barcode h-12 mx-3 mt-3" aria-hidden="true" />
      <div className="px-3 py-3 text-sm leading-relaxed">
        <div className="text-ink">{order.raw_address}</div>
        <div className="text-muted mt-1">
          {channelLabel(order.channel)} · {order.items.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ''}${i.name}`).join(', ')}
        </div>
      </div>
      <div className="border-t-2 border-dashed border-ink px-3 py-3 flex items-center gap-3">
        <span className={`border-[3px] rounded px-3 py-1 font-heading font-semibold tracking-wide -rotate-3 ${STAMP[tier]}`}>
          {actionLabel(a.recommended_action).toUpperCase()}
        </span>
        <span className={`font-heading font-semibold text-3xl tabular-nums ${TIER[a.risk_tier].text}`}>{a.risk_score}</span>
        <span className="text-sm leading-tight">risk score<br /><span className="text-muted">{TIER[a.risk_tier].label} tier</span></span>
        {a.confidence === 'LOW' && (
          <span className="ml-auto text-xs px-2 py-1 rounded bg-medium-soft text-medium-text">Low confidence, check by hand</span>
        )}
      </div>
    </div>
  );
};

const WhyTab = ({ order }) => {
  const { showToast } = useOrders();
  const [copied, setCopied] = useState(false);
  const a = order.risk_assessment;
  const s = order.signals;

  const copy = () => {
    navigator.clipboard?.writeText(a.confirmation_message).catch(() => {});
    setCopied(true);
    showToast('Buyer message copied', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2.5 py-1 rounded bg-primary-soft text-primary">Buyer intent: {humanize(a.buyer_intent)}</span>
        <span className="px-2.5 py-1 rounded bg-subtle text-body">Gemini confidence: {humanize(a.confidence)}</span>
      </div>

      <section>
        <h3 className="font-medium text-ink mb-2">Why Gemini suggests {actionLabel(a.recommended_action).toLowerCase()}</h3>
        <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
          {a.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ol>
      </section>

      {a.key_moments?.length > 0 && (
        <section>
          <h3 className="font-medium text-ink mb-2">What the buyer said</h3>
          <div className="space-y-2">
            {a.key_moments.map((m, i) => (
              <blockquote key={i} className="px-3 py-2 rounded-md bg-subtle italic text-ink">"{m}"</blockquote>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-medium text-ink mb-2">Buyer history</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-3 rounded-md bg-subtle"><dt className="text-xs text-muted">Delivered / total</dt><dd className="font-medium text-ink">{s.customer_delivered} / {s.customer_total_orders}</dd></div>
          <div className="p-3 rounded-md bg-subtle"><dt className="text-xs text-muted">Past returns</dt><dd className={`font-medium ${s.past_rts_count > 0 ? 'text-high-text' : 'text-ink'}`}>{s.past_rts_count}</dd></div>
          <div className="p-3 rounded-md bg-subtle"><dt className="text-xs text-muted">Value vs their average</dt><dd className="font-medium text-ink">{s.order_value_vs_customer_avg ? `${s.order_value_vs_customer_avg}×` : 'First order'}</dd></div>
          <div className="p-3 rounded-md bg-subtle"><dt className="text-xs text-muted">Courier success on route</dt><dd className="font-medium text-ink">{s.courier_success_rate_destination != null ? `${Math.round(s.courier_success_rate_destination * 100)}%` : 'No data'}</dd></div>
        </dl>
      </section>

      {a.confirmation_message && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-ink">Message to send the buyer</h3>
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="p-3 rounded-md border border-line leading-relaxed text-ink">{a.confirmation_message}</p>
        </section>
      )}
    </div>
  );
};

const ADDRESS_FIELDS = [
  ['house', 'House / unit / lot'],
  ['street', 'Street'],
  ['barangay', 'Barangay'],
  ['city', 'City / municipality'],
  ['province', 'Province'],
  ['zip', 'ZIP code'],
  ['landmark', 'Landmark'],
];

const AddressTab = ({ order }) => {
  const p = order.risk_assessment.parsed_address || {};
  const missing = p.missing_fields || [];
  return (
    <div className="space-y-4">
      {missing.length > 0 ? (
        <div className="flex gap-2 p-3 rounded-md bg-medium-soft text-medium-text text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Missing {missing.map(humanize).join(', ').toLowerCase()}. The courier may fail to deliver or call the hub.</span>
        </div>
      ) : (
        <div className="flex gap-2 p-3 rounded-md bg-low-soft text-low-text text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>The address has everything the courier needs.</span>
        </div>
      )}
      <dl className="divide-y divide-line border border-line rounded-md text-sm">
        {ADDRESS_FIELDS.map(([key, label]) => {
          const isMissing = !p[key] || missing.includes(key);
          return (
            <div key={key} className="flex justify-between gap-4 px-3 py-2.5">
              <dt className="text-muted">{label}</dt>
              <dd className={`text-right ${isMissing ? 'text-medium-text font-medium' : 'text-ink'}`}>{p[key] || 'Missing'}</dd>
            </div>
          );
        })}
      </dl>
      <p className="text-xs text-muted">Typed by the buyer: {order.raw_address}</p>
    </div>
  );
};

const ChatTab = ({ order }) => {
  const moments = (order.risk_assessment.key_moments || []).map((m) => m.toLowerCase());
  const convo = order.conversation || [];
  if (convo.length === 0) return <p className="text-muted">No chat for this order. It was placed directly.</p>;
  return (
    <div className="space-y-3">
      {convo.map((msg, i) => {
        const text = msg.message || msg.text || '';
        const isBuyer = msg.sender === 'BUYER' || msg.from === 'buyer';
        const isKey = isBuyer && moments.some((m) => m.includes(text.toLowerCase()) || text.toLowerCase().includes(m));
        return (
          <div key={i} className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}>
            <span className="text-[11px] text-muted mb-1 inline-flex items-center gap-1">
              {isBuyer ? <><User className="w-3 h-3" /> {order.customer.name}</> : <><Store className="w-3 h-3" /> Shop</>}
            </span>
            <p className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
              isBuyer ? (isKey ? 'bg-medium-soft text-ink ring-1 ring-medium' : 'bg-subtle text-ink') : 'bg-primary text-white'
            }`}>
              {text}
            </p>
            {isKey && <span className="text-[11px] text-medium-text mt-1">Gemini flagged this line</span>}
          </div>
        );
      })}
    </div>
  );
};

const HistoryTab = ({ order }) => {
  const log = order.decision_history || [];
  if (log.length === 0) return <p className="text-muted">No decision yet. Accept or override the suggestion below.</p>;
  return (
    <ol className="relative border-l-2 border-line ml-2 space-y-5">
      {[...log].reverse().map((h, i) => (
        <li key={i} className="pl-5 relative">
          <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
          <div className="font-medium text-ink">{actionLabel(h.action)} <span className="font-normal text-muted">by {h.actor}</span></div>
          {h.note && <p className="text-sm mt-0.5">"{h.note}"</p>}
          <div className="text-xs text-muted mt-0.5">{new Date(h.timestamp).toLocaleString()}</div>
        </li>
      ))}
    </ol>
  );
};

export const OrderDrawer = () => {
  const { selectedOrder: order, detailOpen, setDetailOpen, acceptOrder, setOverrideModalOpen } = useOrders();
  const [tab, setTab] = useState('why');

  useEffect(() => { setTab('why'); }, [order?.id]);

  if (!order) return null;

  const a = order.risk_assessment;
  const tabs = [
    ['why', 'Why'],
    ['address', 'Address'],
    ['chat', `Chat (${order.conversation?.length || 0})`],
    ['history', `History (${order.decision_history?.length || 0})`],
  ];
  const accepted = order.decision.status === 'ACCEPTED';

  return (
    <Drawer open={detailOpen} onClose={() => setDetailOpen(false)} labelledBy="drawer-title">
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Order review</p>
          <h2 id="drawer-title" className="font-heading font-medium text-2xl text-ink">{order.customer.name}</h2>
        </div>
        <button onClick={() => setDetailOpen(false)} aria-label="Close order" className="w-10 h-10 rounded-md text-body hover:bg-subtle flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <WaybillSlip order={order} />

        {order.decision.status !== 'PENDING' && (
          <p className="mt-3 text-sm">
            <span className={order.decision.status === 'OVERRIDDEN' ? 'text-medium-text' : 'text-low-text'}>
              {order.decision.status === 'OVERRIDDEN' ? 'Overridden' : 'Accepted'}: {actionLabel(order.decision.action)}
            </span>
            {order.decision.actor && <span className="text-muted"> by {order.decision.actor}</span>}
          </p>
        )}

        <div role="tablist" aria-label="Order details" className="mt-5 flex gap-1 border-b border-line overflow-x-auto">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`px-3 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                tab === id ? 'border-primary text-primary font-medium' : 'border-transparent text-body hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="pt-5">
          {tab === 'why' && <WhyTab order={order} />}
          {tab === 'address' && <AddressTab order={order} />}
          {tab === 'chat' && <ChatTab order={order} />}
          {tab === 'history' && <HistoryTab order={order} />}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-line flex gap-3">
        <Button className="flex-1" onClick={() => acceptOrder(order.id)} disabled={accepted}>
          <ShieldCheck className="w-4 h-4" />
          {accepted ? `Accepted: ${actionLabel(order.decision.action)}` : `Accept: ${actionLabel(a.recommended_action)}`}
        </Button>
        <Button variant="outline" onClick={() => setOverrideModalOpen(true)}>
          <Pencil className="w-4 h-4" />
          Override
        </Button>
      </div>
    </Drawer>
  );
};
