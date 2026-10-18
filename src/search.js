import { channelLabel, actionLabel, TIER } from './components/ui';

// Search across everything a supervisor might type: order number, buyer initials, item, channel,
// city or province, risk tier ("high") and suggested action ("hold", "confirm first").
// Every word must match somewhere, so "bacoor high" finds high-risk orders going to Bacoor.

const haystack = (o) => {
  const a = o.risk_assessment || {};
  const addr = a.parsed_address || {};
  return [
    `#${o.id}`,
    o.customer?.name,
    channelLabel(o.channel),
    ...(o.items || []).map((i) => i.name),
    o.raw_address,
    addr.city,
    addr.province,
    addr.barangay,
    a.risk_tier && `${TIER[a.risk_tier]?.label} risk`,
    a.recommended_action && actionLabel(a.recommended_action),
    o.decision?.status === 'PENDING' ? 'needs review pending' : o.decision?.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

export const terms = (q) => q.toLowerCase().replace(/^#/, '').split(/\s+/).filter(Boolean);

export const matchesQuery = (order, q) => {
  const words = terms(q);
  if (words.length === 0) return true;
  const text = haystack(order);
  return words.every((w) => text.includes(w));
};

/** Quick filters offered when the query names one, e.g. "high" or "review". */
export const FILTER_SUGGESTIONS = [
  { id: 'HIGH', label: 'High risk orders', words: ['high', 'hold'] },
  { id: 'MEDIUM', label: 'Medium risk orders', words: ['medium', 'confirm'] },
  { id: 'LOW', label: 'Low risk orders', words: ['low', 'ship'] },
  { id: 'PENDING', label: 'Orders that need review', words: ['review', 'pending', 'needs'] },
];

export const filterSuggestions = (q) => {
  const words = terms(q);
  if (words.length !== 1 || words[0].length < 2) return [];
  return FILTER_SUGGESTIONS.filter((f) => f.words.some((w) => w.startsWith(words[0])));
};

/** Splits text into [{text, hit}] parts so matches can be highlighted. */
export const highlight = (text, q) => {
  const words = terms(q).filter((w) => w.length > 0);
  if (!text || words.length === 0) return [{ text: text || '', hit: false }];
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  return String(text).split(re).filter(Boolean).map((part) => ({ text: part, hit: words.includes(part.toLowerCase()) }));
};
