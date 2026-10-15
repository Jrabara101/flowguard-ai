import React from 'react';
import { 
  Search, 
  Sparkles, 
  Zap, 
  RotateCw, 
  Clock, 
  TrendingDown, 
  ShieldAlert, 
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export const Topbar = ({ activeTab }) => {
  const { 
    isSimulating, 
    simulationStep, 
    setSimulationModalOpen, 
    searchQuery, 
    setSearchQuery 
  } = useOrders();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'queue':
        return {
          title: 'Action Queue',
          desc: 'High-risk COD orders prioritized for supervisor verification before waybill generation'
        };
      case 'copilot':
        return {
          title: 'Ops Copilot',
          desc: 'Operational intelligence powered by Gemini Pro function calling over warehouse & delivery data'
        };
      case 'dashboard':
        return {
          title: 'Analytics & Backtest Dashboard',
          desc: 'Measurable RTS rate reduction, prevented return fees, and province level logistics insights'
        };
      default:
        return { title: 'FlowGuard AI', desc: 'Fulfillment Supervisor' };
    }
  };

  const { title, desc } = getTabTitle();

  return (
    <header className="border-b border-charcoal-800 bg-charcoal-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: View title & description */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-heading font-bold text-white tracking-tight">{title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-charcoal-300 font-medium">
              Live Demo
            </span>
          </div>
          <p className="text-xs text-charcoal-400 truncate max-w-xl">{desc}</p>
        </div>

        {/* Right: Quick Search + Metrics + Simulate Order CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search box if in Action Queue */}
          {activeTab === 'queue' && (
            <div className="relative w-64">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, items, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/40 transition-colors"
              />
            </div>
          )}

          {/* Quick Metrics Badges */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-xs">
              <TrendingDown className="w-3.5 h-3.5 text-risk-green" />
              <span className="text-charcoal-400">RTS Rate:</span>
              <span className="font-bold text-risk-green">9.2%</span>
              <span className="text-[10px] text-charcoal-500 line-through">15.8%</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-xs">
              <span className="text-gold-400 font-bold">₱</span>
              <span className="text-charcoal-400">Saved:</span>
              <span className="font-bold text-gold-300">₱184.5K</span>
            </div>
          </div>

          {/* Simulate Order Button */}
          <button
            onClick={() => setSimulationModalOpen(true)}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              isSimulating
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 cursor-not-allowed'
                : 'bg-gold-500 hover:bg-gold-400 text-charcoal-950 shadow-gold-glow hover:shadow-lg'
            }`}
          >
            {isSimulating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-gold-400" />
                <span>Scoring with Gemini...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-step live scoring banner when simulation is running */}
      {isSimulating && (
        <div className="bg-charcoal-850 border-t border-gold-500/30 px-6 py-2 flex items-center justify-between animate-shimmer text-xs">
          <div className="flex items-center gap-2 text-gold-300">
            <Sparkles className="w-4 h-4 text-gold-400 animate-spin" />
            <span className="font-semibold text-white">Gemini 1.5 Flash Pipeline:</span>
            <span>{simulationStep}</span>
          </div>
          <span className="text-[11px] font-mono text-gold-400/80">LATENCY ~1.2s · ZERO-SHOT JAPAC MODEL</span>
        </div>
      )}
    </header>
  );
};
