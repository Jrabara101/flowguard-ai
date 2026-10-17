import React, { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Radio, Sparkles, UserCheck } from 'lucide-react';
import { db } from '../firebase';
import { Card, RiskBadge, actionLabel, channelLabel } from './ui';

const ago = (date) => {
  const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

// Live feed of Gemini scores and staff decisions, streamed from Cloud Firestore (onSnapshot).
// The backend writes one document per event; nothing here holds a name or phone number.
export const LiveActivity = ({ max = 8 }) => {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'activity'), orderBy('at', 'desc'), limit(max));
    const stop = onSnapshot(
      q,
      (snap) => { setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setError(false); },
      () => setError(true),
    );
    const timer = setInterval(() => tick((n) => n + 1), 30000); // keep "x min ago" fresh
    return () => { stop(); clearInterval(timer); };
  }, [max]);

  return (
    <Card
      title="Live activity"
      subtitle="Gemini scores and staff decisions as they happen, streamed from Cloud Firestore"
      right={
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-low-soft text-low-text">
          <Radio className="w-3.5 h-3.5" /> {error ? 'Offline' : 'Live'}
        </span>
      }
    >
      {error && <p className="text-sm text-muted">The live feed is unavailable right now. Everything else still works.</p>}
      {!error && events === null && <p className="text-sm text-muted">Connecting to Firestore…</p>}
      {!error && events?.length === 0 && (
        <p className="text-sm text-muted">Nothing yet. Score a new order or decide on one, and it appears here instantly.</p>
      )}
      {!error && events?.length > 0 && (
        <ul className="divide-y divide-line">
          {events.map((e) => {
            const at = e.at?.toDate ? e.at.toDate() : null;
            const scored = e.type === 'scored';
            return (
              <li key={e.id} className="py-2.5 flex items-center gap-3 text-sm">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${scored ? 'bg-primary-soft text-primary' : 'bg-low-soft text-low-text'}`}>
                  {scored ? <Sparkles className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate">
                    {scored ? (
                      <>Gemini scored <b>#{e.order_id}</b>: {actionLabel(e.action)}</>
                    ) : (
                      <>Staff {e.overrode_ai ? 'overrode' : 'accepted'} <b>#{e.order_id}</b>: {actionLabel(e.action)}</>
                    )}
                  </p>
                  <p className="text-[13px] text-muted truncate">
                    {[channelLabel(e.channel), e.route].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {scored && <RiskBadge tier={e.risk_tier} score={e.risk_score} />}
                {!scored && e.overrode_ai && <span className="text-xs px-2 py-0.5 rounded bg-medium-soft text-medium-text">Override</span>}
                <span className="text-[13px] text-muted shrink-0 w-20 text-right">{at ? ago(at) : ''}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
