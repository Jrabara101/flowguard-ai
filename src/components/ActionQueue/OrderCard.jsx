import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Package, 
  ShoppingBag,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const OrderCard = ({ order, isSelected, onSelect }) => {
  const { id, channel, amount, items, customer, raw_address, risk_assessment, decision } = order;
  const { risk_score, risk_tier, recommended_action, buyer_intent } = risk_assessment;

  const getRiskStyles = () => {
    switch (risk_tier) {
      case 'HIGH':
        return {
          border: isSelected ? 'border-risk-red shadow-red-glow' : 'border-charcoal-750 hover:border-risk-red/60',
          badge: 'bg-risk-red/20 text-risk-red border-risk-red/40',
          actionBadge: 'bg-risk-red text-white',
          icon: AlertOctagon,
          indicator: 'bg-risk-red',
          glow: 'from-risk-red/10'
        };
      case 'MEDIUM':
        return {
          border: isSelected ? 'border-risk-amber shadow-amber-glow' : 'border-charcoal-750 hover:border-risk-amber/60',
          badge: 'bg-risk-amber/20 text-risk-amber border-risk-amber/40',
          actionBadge: 'bg-risk-amber text-charcoal-950 font-bold',
          icon: AlertTriangle,
          indicator: 'bg-risk-amber',
          glow: 'from-risk-amber/10'
        };
      case 'LOW':
      default:
        return {
          border: isSelected ? 'border-risk-green shadow-green-glow' : 'border-charcoal-750 hover:border-risk-green/60',
          badge: 'bg-risk-green/20 text-risk-green border-risk-green/40',
          actionBadge: 'bg-risk-green text-charcoal-950 font-bold',
          icon: CheckCircle2,
          indicator: 'bg-risk-green',
          glow: 'from-risk-green/10'
        };
    }
  };

  const style = getRiskStyles();
  const RiskIcon = style.icon;

  const getActionLabel = (action) => {
    switch (action) {
      case 'SHIP_NOW':
        return 'Ship Now';
      case 'CONFIRM_FIRST':
        return 'Confirm First';
      case 'HOLD':
        return 'Hold';
      default:
        return action;
    }
  };

  const getIntentBadge = () => {
    switch (buyer_intent) {
      case 'HESITANT':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'PRICE_SHOPPING':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'COMMITTED':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
      case 'UNVERIFIED':
      default:
        return 'bg-purple-950/60 text-purple-300 border-purple-800/60';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 bg-charcoal-850/90 border ${style.border} ${
        isSelected ? 'bg-charcoal-800' : 'hover:bg-charcoal-800/80'
      }`}
    >
      {/* Risk color accent indicator bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r ${style.indicator}`} />

      {/* Card Header: Order ID + Channel + Amount */}
      <div className="flex items-start justify-between gap-2 mb-2 pl-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading font-bold text-sm text-white">#{id}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 border border-charcoal-700 text-charcoal-300 font-medium">
            {channel}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getIntentBadge()}`}>
            {buyer_intent}
          </span>
        </div>

        <div className="text-right">
          <span className="font-heading font-bold text-sm text-gold-300">₱{amount.toLocaleString()}</span>
          <span className="text-[10px] text-charcoal-400 block font-medium">COD</span>
        </div>
      </div>

      {/* Items summary */}
      <div className="pl-2 mb-3 text-xs text-charcoal-300 flex items-center gap-1.5 truncate">
        <Package className="w-3.5 h-3.5 text-charcoal-500 shrink-0" />
        <span className="truncate">{items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
      </div>

      {/* Address excerpt */}
      <div className="pl-2 mb-3 text-[11px] text-charcoal-400 flex items-center gap-1.5 truncate">
        <MapPin className="w-3.5 h-3.5 text-charcoal-500 shrink-0" />
        <span className="truncate">{raw_address}</span>
      </div>

      {/* Bottom row: Risk Score & Action Pill & Decision state */}
      <div className="pl-2 pt-2 border-t border-charcoal-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Risk score pill */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${style.badge}`}>
            <RiskIcon className="w-3 h-3" />
            <span>Score: {risk_score}</span>
          </div>

          {/* Action pill */}
          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase ${style.actionBadge}`}>
            {getActionLabel(recommended_action)}
          </div>
        </div>

        {/* Decision status indicator */}
        <div>
          {decision.status === 'PENDING' ? (
            <span className="text-[10px] text-charcoal-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gold-400/80" />
              <span>Pending Review</span>
            </span>
          ) : decision.status === 'ACCEPTED' ? (
            <span className="text-[10px] text-risk-green font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Approved</span>
            </span>
          ) : (
            <span className="text-[10px] text-risk-amber font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Overridden</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
