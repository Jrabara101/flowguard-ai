import React, { useState } from 'react';
import { X, Zap, Sparkles, AlertOctagon, AlertTriangle, CheckCircle2, ChevronRight, Store } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { SIMULATION_PRESETS } from '../../data/mockData';

export const SimulateOrderModal = () => {
  const { simulationModalOpen, setSimulationModalOpen, simulateIncomingOrder } = useOrders();
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  if (!simulationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-charcoal-900 border border-charcoal-750 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={() => setSimulationModalOpen(false)}
          className="absolute right-4 top-4 text-charcoal-400 hover:text-white p-1 rounded-lg hover:bg-charcoal-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gold-500/15 text-gold-400">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">Simulate Incoming COD Webhook</h3>
            <p className="text-xs text-charcoal-400">Simulates real-time e-commerce webhook payload scored by Gemini 1.5 Flash</p>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="p-3.5 rounded-xl bg-charcoal-850 border border-charcoal-750 text-xs text-charcoal-300 mb-4 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
          <span>Select an incoming scenario to watch Gemini Flash parse the Taglish Messenger chat, evaluate courier coverage, and compute the RTS risk in real time.</span>
        </div>

        {/* Scenario Presets */}
        <div className="space-y-2.5 mb-6">
          <div className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
            Select Test Scenario:
          </div>

          {SIMULATION_PRESETS.map((preset, idx) => {
            const isSelected = selectedPresetIndex === idx;
            const predicted = preset.predicted;
            return (
              <div
                key={idx}
                onClick={() => setSelectedPresetIndex(idx)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-charcoal-800 border-gold-500 shadow-gold-glow'
                    : 'bg-charcoal-850/60 border-charcoal-750 hover:bg-charcoal-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-xs text-white">{preset.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-700 text-charcoal-300">
                      {preset.channel}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    predicted.risk_tier === 'HIGH' ? 'bg-risk-red/20 text-risk-red' : predicted.risk_tier === 'MEDIUM' ? 'bg-risk-amber/20 text-risk-amber' : 'bg-risk-green/20 text-risk-green'
                  }`}>
                    Exp: {predicted.risk_tier} ({predicted.risk_score})
                  </span>
                </div>

                <div className="text-[11px] text-charcoal-400 truncate">
                  Item: {preset.items[0].name} · ₱{preset.amount.toLocaleString()} COD · {preset.raw_address}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-charcoal-800">
          <span className="text-[11px] text-charcoal-500">
            Pipeline: Signals → Vertex AI Gemini Flash → Action Queue
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSimulationModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-300 hover:bg-charcoal-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => simulateIncomingOrder(selectedPresetIndex)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gold-500 hover:bg-gold-400 text-charcoal-950 shadow-gold-glow flex items-center gap-2 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Score Order Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
