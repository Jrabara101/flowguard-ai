import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Shared building blocks for the Frest-style screens.

export const TIER = {
  HIGH: { label: 'High', text: 'text-high-text', soft: 'bg-high-soft', bar: 'bg-high' },
  MEDIUM: { label: 'Medium', text: 'text-medium-text', soft: 'bg-medium-soft', bar: 'bg-medium' },
  LOW: { label: 'Low', text: 'text-low-text', soft: 'bg-low-soft', bar: 'bg-low' },
};

export const ACTION = {
  SHIP_NOW: { label: 'Ship now', tier: 'LOW' },
  CONFIRM_FIRST: { label: 'Confirm first', tier: 'MEDIUM' },
  HOLD: { label: 'Hold', tier: 'HIGH' },
};

export const actionLabel = (action) => ACTION[action]?.label || action;

const CHANNEL = { MESSENGER: 'Messenger', META_SHOP: 'Meta Shop', TIKTOK_SHOP: 'TikTok Shop', PANCAKE_POS: 'Pancake POS' };

export const channelLabel = (c) => CHANNEL[c] || (c || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export const peso =(n) => `₱${Math.round(n).toLocaleString()}`;

export const Card = ({ title, subtitle, right, children, className = '', bodyClass = 'p-5' }) => (
  <section className={`bg-white rounded-md shadow-card ${className}`}>
    {title && (
      <div className="px-5 pt-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading font-medium text-ink text-[17px]">{title}</h2>
          {subtitle && <p className="text-[13px] text-muted mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
    )}
    <div className={bodyClass}>{children}</div>
  </section>
);

export const RiskBadge = ({ tier, score }) => {
  const t = TIER[tier] || TIER.LOW;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${t.soft} ${t.text}`}>
      {t.label}{score != null && ` ${score}`}
    </span>
  );
};

export const ScoreBar = ({ score, tier }) => {
  const t = TIER[tier] || TIER.LOW;
  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <span className={`w-7 font-semibold tabular-nums ${t.text}`}>{score}</span>
      <div className="flex-1 h-1.5 rounded-full bg-subtle" aria-hidden="true">
        <div className={`h-1.5 rounded-full ${t.bar}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
    </div>
  );
};

export const Button = ({ variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-primary text-white shadow-primary hover:bg-primary-dark',
    secondary: 'bg-subtle text-body hover:bg-line',
    outline: 'border border-line bg-white text-body hover:bg-subtle',
    danger: 'bg-high text-white hover:brightness-95',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 min-h-[40px] px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
};

// A modal listens in the capture phase and stops the event, so Escape closes it without also closing a drawer under it.
const useEscape = (open, onClose, capture = false) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (capture) e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey, capture);
    return () => document.removeEventListener('keydown', onKey, capture);
  }, [open, onClose, capture]);
};

// Centered dialog with the Frest close button sitting on the top-right corner.
export const Modal = ({ open, onClose, labelledBy, maxWidth = 'max-w-lg', role = 'dialog', children }) => {
  useEscape(open, onClose, true);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center overflow-y-auto bg-[rgba(34,48,62,0.5)] px-4 py-16" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role={role} aria-modal="true" aria-labelledby={labelledBy} className={`relative w-full ${maxWidth} bg-white rounded-md shadow-pop animate-pop`}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 w-9 h-9 rounded-md bg-white shadow-pop text-body hover:text-ink flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
};

// Panel that slides in from the right edge.
export const Drawer = ({ open, onClose, labelledBy, children }) => {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-drawer bg-[rgba(34,48,62,0.4)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="absolute inset-y-0 right-0 w-full max-w-[480px] bg-white shadow-pop flex flex-col animate-drawer">
        {children}
      </aside>
    </div>
  );
};
