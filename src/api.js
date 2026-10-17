// FlowGuard API client. Paths are relative so it works behind the Vite dev proxy and on Cloud Run.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json.message || `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status });
  }
  return json;
}

const ACTOR_LABEL = { STAFF: 'Supervisor (Ops Team)', AI: 'FlowGuard AI' };

/** Turns the backend's order detail into the shape the screens use. */
export function adaptOrder(detail) {
  const o = detail.order;
  const a = detail.risk_assessment;
  const s = a?.signals || {};
  const history = [...(detail.decision_history || [])]
    .sort((x, y) => new Date(x.timestamp) - new Date(y.timestamp))
    .map((h) => ({ ...h, actor: ACTOR_LABEL[h.actor] || h.actor }));
  const last = history[history.length - 1];

  return {
    id: o.id,
    channel: o.channel,
    amount: o.amount,
    payment_type: o.payment_type,
    status: o.status,
    created_at: o.placed_at,
    items: o.items,
    raw_address: o.address,
    customer: {
      name: o.customer.name_masked,
      phone_masked: o.customer.phone_hash,
      phone_hash: o.customer.phone_hash,
      total_orders: s.total_orders ?? 0,
      delivered_count: s.delivered_count ?? 0,
      rts_count: s.rts_count ?? 0,
    },
    signals: {
      customer_total_orders: s.total_orders ?? 0,
      customer_delivered: s.delivered_count ?? 0,
      customer_rts: s.rts_count ?? 0,
      past_rts_count: s.past_rts_count ?? 0,
      order_value_vs_customer_avg: s.order_value_vs_customer_average ?? null,
      is_repeat_phone: !!s.is_repeat_phone,
      courier_success_rate_destination: s.area_courier_success_rate ?? null,
      is_cod: !!s.is_cod,
    },
    conversation: detail.conversation || [],
    risk_assessment: a,
    decision: last
      ? { status: last.overrode_ai ? 'OVERRIDDEN' : 'ACCEPTED', action: last.action, actor: last.actor, note: last.note, timestamp: last.timestamp }
      : { status: 'PENDING', action: null, actor: null, note: null, timestamp: null },
    decision_history: history,
  };
}

export const api = {
  queue: async () => (await request('/queue')).orders.map(adaptOrder),
  simulate: async () => adaptOrder(await request('/queue/simulate', { method: 'POST', body: {} })),
  decide: async (id, action, note) =>
    adaptOrder(await request(`/orders/${id}/decision`, { method: 'POST', body: { ...(action ? { action } : {}), ...(note ? { note } : {}) } })),
  dashboard: () => request('/dashboard'),
  copilot: (message) => request('/ai/copilot', { method: 'POST', body: { message } }),
};
