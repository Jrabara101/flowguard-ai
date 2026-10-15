import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Calendar, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  TrendingUp, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export const OrderDetailPanel = ({ order }) => {
  const { 
    acceptOrder, 
    setOverrideModalOpen, 
    setChatDrawerOpen, 
    showToast 
  } = useOrders();

  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-charcoal-400">
        <AlertTriangle className="w-12 h-12 text-charcoal-600 mb-3" />
        <h3 className="font-heading font-semibold text-white text-base">No Order Selected</h3>
        <p className="text-xs max-w-sm mt-1">Select an order from the Action Queue to review Gemini's RTS assessment, address breakdown, and draft buyer message.</p>
      </div>
    );
  }

  const { id, channel, amount, payment_type, items, raw_address, customer, signals, risk_assessment, decision, decision_history, created_at } = order;
  const { risk_score, risk_tier, recommended_action, buyer_intent, confidence, reasons, key_moments, parsed_address, confirmation_message } = risk_assessment;

  const handleCopyMessage = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(confirmation_message).catch(() => {});
      }
    } catch (err) {
      // ignore
    }
    setCopied(true);
    showToast('Draft message copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const getRiskColor = () => {
    if (risk_tier === 'HIGH') return { text: 'text-risk-red', bg: 'bg-risk-red/15', border: 'border-risk-red/30', badge: 'bg-risk-red text-white' };
    if (risk_tier === 'MEDIUM') return { text: 'text-risk-amber', bg: 'bg-risk-amber/15', border: 'border-risk-amber/30', badge: 'bg-risk-amber text-charcoal-950' };
    return { text: 'text-risk-green', bg: 'bg-risk-green/15', border: 'border-risk-green/30', badge: 'bg-risk-green text-charcoal-950' };
  };

  const riskStyle = getRiskColor();

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Top Banner: Order Header + Decision Status */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-heading font-extrabold text-white">Order #{id}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-charcoal-300 font-medium">
              {channel}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-300 font-semibold">
              {payment_type}
            </span>
            {confidence === 'LOW' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-medium flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Low Confidence · Manual Check Required</span>
              </span>
            )}
          </div>
          <p className="text-xs text-charcoal-400 mt-1 flex items-center gap-2">
            <span>Customer: <strong className="text-charcoal-200">{customer.name}</strong> ({customer.phone_masked})</span>
            <span>·</span>
            <span>Placed: {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>

        {/* Amount & Quick Action Decision state */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-heading font-black text-gold-400">₱{amount.toLocaleString()}</div>
            <div className="text-[11px] text-charcoal-400">Total COD Collectible</div>
          </div>

          {/* Decision Status Pill */}
          <div className="pl-4 border-l border-charcoal-750">
            {decision.status === 'PENDING' ? (
              <span className="px-3 py-1.5 rounded-xl bg-charcoal-800 border border-gold-500/30 text-gold-400 text-xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Awaiting Decision</span>
              </span>
            ) : decision.status === 'ACCEPTED' ? (
              <span className="px-3 py-1.5 rounded-xl bg-risk-green/20 border border-risk-green/40 text-risk-green text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved: {decision.action}</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-risk-amber/20 border border-risk-amber/40 text-risk-amber text-xs font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Overridden: {decision.action}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Risk Assessment Summary & Customer Signals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Score Dial Card */}
        <div className={`p-5 rounded-2xl border ${riskStyle.border} ${riskStyle.bg} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-charcoal-300 mb-2">
              <span>RTS RISK SCORE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-900/60 text-charcoal-300">0–100 Scale</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-heading font-black ${riskStyle.text}`}>{risk_score}</span>
              <span className="text-charcoal-400 font-medium text-sm">/ 100</span>
              <span className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider ${riskStyle.badge}`}>
                {risk_tier} RISK
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-charcoal-900/80 rounded-full h-2.5 mt-3 overflow-hidden border border-charcoal-700">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  risk_tier === 'HIGH' ? 'bg-risk-red shadow-red-glow' : risk_tier === 'MEDIUM' ? 'bg-risk-amber' : 'bg-risk-green'
                }`}
                style={{ width: `${Math.min(risk_score, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-charcoal-800/80 flex items-center justify-between text-xs">
            <span className="text-charcoal-400">Recommended Action:</span>
            <span className="font-bold text-white uppercase tracking-wider">{recommended_action.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Customer History Signals */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-charcoal-300 mb-3 flex items-center justify-between">
              <span>CUSTOMER HISTORY SIGNALS</span>
              <User className="w-3.5 h-3.5 text-charcoal-500" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700/60">
                <div className="text-charcoal-400 text-[10px]">Delivered / Total</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {signals.customer_delivered} / {signals.customer_total_orders}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700/60">
                <div className="text-charcoal-400 text-[10px]">Past RTS Count</div>
                <div className={`text-sm font-bold mt-0.5 ${signals.past_rts_count > 0 ? 'text-risk-red' : 'text-risk-green'}`}>
                  {signals.past_rts_count} Orders
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700/60">
                <div className="text-charcoal-400 text-[10px]">Value vs Avg</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {signals.order_value_vs_customer_avg ? `${signals.order_value_vs_customer_avg}x` : 'N/A (1st order)'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700/60">
                <div className="text-charcoal-400 text-[10px]">Courier Route Rate</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {Math.round((signals.courier_success_rate_destination || 0.90) * 100)}% Success
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-charcoal-400 flex items-center justify-between">
            <span>Phone seen on other accounts:</span>
            <span className="font-semibold text-charcoal-300">{signals.phone_seen_on_other_accounts} accounts</span>
          </div>
        </div>

        {/* Buyer Intent & Confidence */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-charcoal-300 mb-3 flex items-center justify-between">
              <span>BUYER INTENT & AI CONFIDENCE</span>
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-charcoal-400 block mb-1">Assessed Intent:</span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-charcoal-800 border border-charcoal-700 text-gold-300 inline-block">
                  {buyer_intent}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-charcoal-400 block mb-1">Gemini Flash Confidence:</span>
                <span className={`px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                  confidence === 'HIGH' ? 'bg-risk-green/15 text-risk-green border border-risk-green/30' : 'bg-risk-amber/15 text-risk-amber border border-risk-amber/30'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {confidence} CONFIDENCE
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-charcoal-800 text-[10px] text-charcoal-400">
            Model: <span className="text-charcoal-300 font-medium">Gemini 1.5 Flash (zero-shot structured reasoning)</span>
          </div>
        </div>
      </div>

      {/* Primary Section 1: Plain-English Reasons */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-gold-400" />
            <span>AI Assessment Reasons ({reasons.length})</span>
          </h3>
          <span className="text-[10px] text-charcoal-500">Ordered by significance</span>
        </div>

        <div className="space-y-2">
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-charcoal-800/80 border border-charcoal-700/60 text-xs">
              <span className="w-5 h-5 rounded-full bg-charcoal-700 text-gold-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <p className="text-charcoal-200 font-medium leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Section 2: Key Chat Moments & Conversation Drawer */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gold-400" />
            <span>Key Chat Moments (Messenger Taglish)</span>
          </h3>

          <button
            onClick={() => setChatDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-semibold hover:underline"
          >
            <span>View Full Conversation ({order.conversation?.length || 0})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {key_moments && key_moments.length > 0 ? (
          <div className="space-y-2">
            {key_moments.map((moment, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-xl bg-charcoal-800/90 border-l-4 border-gold-500 border-r border-t border-b border-charcoal-700 text-xs italic text-charcoal-200"
              >
                "{moment}"
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-charcoal-800 text-xs text-charcoal-400 text-center">
            No specific chat moments flagged (direct order placement).
          </div>
        )}
      </div>

      {/* Primary Section 3: Parsed Address with Missing Fields Highlighted */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-400" />
              <span>Parsed Philippine Delivery Address</span>
            </h3>
            <p className="text-[11px] text-charcoal-400 mt-0.5">Courier validation against J&T Express & Flash routing standards</p>
          </div>

          {parsed_address.missing_fields && parsed_address.missing_fields.length > 0 ? (
            <span className="px-2.5 py-1 rounded-lg bg-risk-amber/20 border border-risk-amber/40 text-risk-amber text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{parsed_address.missing_fields.length} Field(s) Missing</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-risk-green/20 border border-risk-green/40 text-risk-green text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Address Fully Verified</span>
            </span>
          )}
        </div>

        {/* Missing Fields Alert Callout */}
        {parsed_address.missing_fields && parsed_address.missing_fields.length > 0 && (
          <div className="p-3 rounded-xl bg-risk-amber/10 border border-risk-amber/30 text-xs text-risk-amber flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-risk-amber" />
            <div>
              <strong>Missing courier requirements: </strong>
              <span>{parsed_address.missing_fields.map(f => f.replace('_', ' ')).join(', ')}. Courier dispatch will likely fail or require hub calls.</span>
            </div>
          </div>
        )}

        {/* Structured Address Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className={`p-2.5 rounded-xl border ${!parsed_address.house ? 'bg-risk-amber/10 border-risk-amber/40' : 'bg-charcoal-800 border-charcoal-700'}`}>
            <span className="text-[10px] text-charcoal-400 block font-medium">House / Unit / Lot:</span>
            <span className={`font-semibold ${!parsed_address.house ? 'text-risk-amber italic' : 'text-white'}`}>
              {parsed_address.house || '⚠️ Missing'}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${!parsed_address.street ? 'bg-risk-amber/10 border-risk-amber/40' : 'bg-charcoal-800 border-charcoal-700'}`}>
            <span className="text-[10px] text-charcoal-400 block font-medium">Street Name:</span>
            <span className={`font-semibold ${!parsed_address.street ? 'text-risk-amber italic' : 'text-white'}`}>
              {parsed_address.street || '⚠️ Missing'}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${!parsed_address.barangay ? 'bg-risk-amber/10 border-risk-amber/40' : 'bg-charcoal-800 border-charcoal-700'}`}>
            <span className="text-[10px] text-charcoal-400 block font-medium">Barangay:</span>
            <span className={`font-semibold ${!parsed_address.barangay ? 'text-risk-amber italic' : 'text-white'}`}>
              {parsed_address.barangay || '⚠️ Missing Barangay'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700">
            <span className="text-[10px] text-charcoal-400 block font-medium">City / Municipality:</span>
            <span className="font-semibold text-white">{parsed_address.city || 'N/A'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700">
            <span className="text-[10px] text-charcoal-400 block font-medium">Province:</span>
            <span className="font-semibold text-white">{parsed_address.province || 'N/A'}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700">
            <span className="text-[10px] text-charcoal-400 block font-medium">ZIP Code:</span>
            <span className="font-semibold text-white">{parsed_address.zip || 'N/A'}</span>
          </div>

          <div className={`col-span-2 p-2.5 rounded-xl border ${parsed_address.missing_fields?.includes('landmark') ? 'bg-risk-amber/10 border-risk-amber/40' : 'bg-charcoal-800 border-charcoal-700'}`}>
            <span className="text-[10px] text-charcoal-400 block font-medium">Nearby Landmark:</span>
            <span className={`font-semibold ${!parsed_address.landmark ? 'text-risk-amber italic' : 'text-gold-300'}`}>
              {parsed_address.landmark || '⚠️ Missing Landmark (hard to find)'}
            </span>
          </div>
        </div>

        {/* Raw Address Line */}
        <div className="p-2.5 rounded-xl bg-charcoal-900 border border-charcoal-800 text-[11px] text-charcoal-400 flex items-center justify-between">
          <span className="truncate"><strong>Raw input:</strong> {raw_address}</span>
        </div>
      </div>

      {/* Primary Section 4: Draft Confirmation Message with Copy Button */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gold-400" />
              <span>Draft Messenger Confirmation Message</span>
            </h3>
            <p className="text-[11px] text-charcoal-400 mt-0.5">Polite, non-accusatory Taglish copy requesting only missing courier details</p>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyMessage}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              copied
                ? 'bg-risk-green text-charcoal-950 font-bold'
                : 'bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 shadow-sm'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Message</span>
              </>
            )}
          </button>
        </div>

        {/* Message Bubble Preview */}
        <div className="p-4 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-100 font-sans leading-relaxed relative">
          <p className="pr-12">{confirmation_message}</p>
          <span className="absolute bottom-2 right-3 text-[10px] text-charcoal-500">Messenger Ready</span>
        </div>
      </div>

      {/* Primary Section 5: Accept & Override Action Buttons */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-300">Supervisor Decision</h4>
          <p className="text-[11px] text-charcoal-400">Accept Gemini's recommendation or override with custom operational instructions</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Override Button */}
          <button
            onClick={() => setOverrideModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 border border-charcoal-700 text-white text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-risk-amber" />
            <span>Override AI</span>
          </button>

          {/* Accept Recommendation Button */}
          <button
            onClick={() => acceptOrder(id)}
            disabled={decision.status === 'ACCEPTED'}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              decision.status === 'ACCEPTED'
                ? 'bg-charcoal-800 text-charcoal-500 border border-charcoal-700 cursor-not-allowed'
                : 'bg-gold-500 hover:bg-gold-400 text-charcoal-950 shadow-gold-glow'
            }`}
          >
            <ShieldCheck className="w-4 h-4 fill-current" />
            <span>Accept: {recommended_action.replace('_', ' ')}</span>
          </button>
        </div>
      </div>

      {/* Decision Audit History Log (if any) */}
      {decision_history && decision_history.length > 0 && (
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-300">Decision Audit Log</h4>
          <div className="divide-y divide-charcoal-800">
            {decision_history.map((log, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">{log.action}</span>
                  <span className="text-charcoal-400 text-[11px] ml-2">by {log.actor}</span>
                  {log.note && <p className="text-[11px] text-charcoal-300 mt-0.5">Note: "{log.note}"</p>}
                </div>
                <div className="text-right text-[10px] text-charcoal-500">
                  <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                  <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
