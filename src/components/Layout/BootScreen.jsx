import React, { useEffect, useState } from 'react';
import { useOrders } from '../../context/OrderContext';

/**
 * Loading page shown while the dashboard fetches the queue for the first time.
 * It waits 150 ms before appearing, so a fast load never flashes it, and fades out when the data arrives.
 */
export const BootScreen = () => {
  const { loading, orders, loadError } = useOrders();
  const booting = loading && orders.length === 0 && !loadError;
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (booting) {
      const t = setTimeout(() => setVisible(true), 150);
      return () => clearTimeout(t);
    }
    if (visible) {
      setLeaving(true);
      const t = setTimeout(() => { setVisible(false); setLeaving(false); }, 280);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [booting]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-toast bg-canvas flex flex-col items-center justify-center gap-6 transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <img src="/logo.png" alt="" className="w-14 h-14 object-contain animate-breathe" />
      <div className="text-center">
        <p className="font-heading font-semibold text-xl text-ink">Opening the action queue</p>
        <p className="mt-1 text-sm text-muted">Loading orders Gemini has already scored</p>
      </div>
      <div className="w-56 h-1.5 rounded-full bg-line overflow-hidden" aria-hidden="true">
        <div className="h-full w-1/3 rounded-full bg-primary animate-indeterminate" />
      </div>
    </div>
  );
};
