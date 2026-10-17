import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon, XCircle } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export const OverrideModal = () => {
  const { selectedOrder, overrideModalOpen, setOverrideModalOpen, overrideOrder } = useOrders();
  const [selectedAction, setSelectedAction] = useState('SHIP_NOW');
  const [overrideNote, setOverrideNote] = useState('');

  if (!overrideModalOpen || !selectedOrder) return null;

  const currentAction = selectedOrder.risk_assessment.recommended_action;

  const options = [
    {
      id: 'SHIP_NOW',
      title: 'Ship Now',
      desc: 'Bypass risk warnings and immediately release for waybill generation.',
      icon: CheckCircle2,
      color: 'text-risk-green border-risk-green/40'
    },
    {
      id: 'CONFIRM_FIRST',
      title: 'Confirm First',
      desc: 'Hold waybill until customer verifies delivery date or missing address.',
      icon: AlertTriangle,
      color: 'text-risk-amber border-risk-amber/40'
    },
    {
      id: 'HOLD',
      title: 'Hold Order',
      desc: 'Keep on hold due to severe RTS probability or unverified buyer.',
      icon: AlertOctagon,
      color: 'text-risk-red border-risk-red/40'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    overrideOrder(selectedOrder.id, selectedAction, overrideNote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-charcoal-900 border border-charcoal-750 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={() => setOverrideModalOpen(false)}
          className="absolute right-4 top-4 text-charcoal-400 hover:text-white p-1 rounded-lg hover:bg-charcoal-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-risk-amber/15 text-risk-amber">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">Override AI Recommendation</h3>
            <p className="text-xs text-charcoal-400">Order #{selectedOrder.id} · AI recommended: <strong className="text-gold-400">{currentAction}</strong></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-charcoal-300">Select Override Action:</label>
            <div className="space-y-2">
              {options.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedAction === opt.id;
                return (
                  <label
                    key={opt.id}
                    onClick={() => setSelectedAction(opt.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-charcoal-800 border-gold-500 shadow-gold-glow'
                        : 'bg-charcoal-850/60 border-charcoal-750 hover:bg-charcoal-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="overrideAction"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setSelectedAction(opt.id)}
                      className="mt-1 accent-gold-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{opt.title}</span>
                      </div>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Supervisor note input */}
          <div>
            <label className="text-xs font-semibold text-charcoal-300 block mb-1.5">
              Supervisor Justification (Saved in Audit Log):
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Spoke with customer on mobile; verified landmark and agreed to dispatch."
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-3 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-gold-500/60"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOverrideModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-300 hover:bg-charcoal-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gold-500 hover:bg-gold-400 text-charcoal-950 shadow-gold-glow transition-all"
            >
              Confirm Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
