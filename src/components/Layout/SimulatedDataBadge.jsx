import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

export const SimulatedDataBadge = () => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-400">
      <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
      <span className="font-medium text-gold-400">Simulated Data</span>
      <span className="text-charcoal-500">|</span>
      <span>Synthetic PH J&T / Pancake records</span>
    </div>
  );
};
