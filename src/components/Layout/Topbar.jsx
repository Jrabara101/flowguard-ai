import React from 'react';
import { Menu, Sparkles } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { SearchBox } from './SearchBox';

export const Topbar = ({ activeTab, onMenu }) => {
  const { isSimulating, simulationStep } = useOrders();

  return (
    <div className="sticky top-0 z-30 px-4 sm:px-6 pt-4 bg-canvas">
      <header className="bg-white rounded-md shadow-card min-h-[60px] px-4 flex items-center gap-3">
        <button onClick={onMenu} aria-label="Open menu" className="lg:hidden p-2 -ml-2 text-body hover:text-ink">
          <Menu className="w-5 h-5" />
        </button>

        <SearchBox activeTab={activeTab} />

        <span className="hidden sm:inline text-xs px-2.5 py-1 rounded bg-medium-soft text-medium-text">Simulated data</span>
        <div className="w-9 h-9 rounded-full bg-primary-soft text-primary font-semibold text-sm flex items-center justify-center" aria-label="Signed in as supervisor">
          OPS
        </div>
      </header>

      {isSimulating && (
        <div role="status" className="mt-3 rounded-md animate-stripe px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink">
          <Sparkles className="w-4 h-4 text-primary animate-spin" />
          <span className="font-medium">Gemini Flash is scoring a new order.</span>
          <span className="text-body">{simulationStep}</span>
          <span className="ml-auto text-xs text-muted">Usually 7 to 10 seconds</span>
        </div>
      )}
    </div>
  );
};
