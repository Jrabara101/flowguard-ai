import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { Button, Modal, ACTION, TIER, actionLabel, peso } from '../ui';

const OPTIONS = [
  { id: 'SHIP_NOW', desc: 'Print the waybill now.' },
  { id: 'CONFIRM_FIRST', desc: 'Message the buyer before printing.' },
  { id: 'HOLD', desc: 'Keep the order until you release it.' },
];

export const OverrideModal = () => {
  const { selectedOrder, overrideModalOpen, setOverrideModalOpen, overrideOrder } = useOrders();
  const [selectedAction, setSelectedAction] = useState('SHIP_NOW');
  const [overrideNote, setOverrideNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Start on a choice that differs from the AI's, since that is the point of overriding.
  useEffect(() => {
    if (!overrideModalOpen || !selectedOrder) return;
    const ai = selectedOrder.risk_assessment.recommended_action;
    setSelectedAction(ai === 'SHIP_NOW' ? 'CONFIRM_FIRST' : 'SHIP_NOW');
    setOverrideNote('');
  }, [overrideModalOpen, selectedOrder?.id]);

  if (!selectedOrder) return null;

  const a = selectedOrder.risk_assessment;
  const close = () => !saving && setOverrideModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await overrideOrder(selectedOrder.id, selectedAction, overrideNote);
    setSaving(false);
  };

  return (
    <Modal open={overrideModalOpen} onClose={close} labelledBy="override-title">
      <form onSubmit={handleSubmit} className="px-7 pt-7 pb-6">
        <h2 id="override-title" className="font-heading font-medium text-xl text-ink text-center">Override decision</h2>
        <p className="mt-1 mb-6 text-center text-sm">
          {selectedOrder.customer.name} · {peso(selectedOrder.amount)} · Gemini suggests{' '}
          <span className={`font-medium ${TIER[a.risk_tier].text}`}>{actionLabel(a.recommended_action)} ({a.risk_score})</span>
        </p>

        <fieldset>
          <legend className="text-sm font-medium text-ink mb-2">New decision</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {OPTIONS.map((opt) => {
              const checked = selectedAction === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex flex-col gap-1 p-3 rounded-md cursor-pointer transition-colors ${
                    checked ? 'border-2 border-primary bg-primary-soft/40 p-[11px]' : 'border border-line hover:bg-subtle'
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium text-ink">
                    <input type="radio" name="override-action" value={opt.id} checked={checked} onChange={() => setSelectedAction(opt.id)} className="accent-primary" />
                    <span className={TIER[ACTION[opt.id].tier].text}>{actionLabel(opt.id)}</span>
                  </span>
                  <span className="text-xs text-muted">{opt.desc}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label htmlFor="override-note" className="block mt-5 mb-1.5 text-sm font-medium text-ink">Reason (saved in the audit log)</label>
        <textarea
          id="override-note"
          rows={3}
          placeholder="e.g. Called the buyer and confirmed the landmark."
          value={overrideNote}
          onChange={(e) => setOverrideNote(e.target.value)}
          className="w-full rounded border border-line px-3 py-2 text-ink placeholder:text-muted focus:outline-none focus:border-primary"
        />

        <div className="mt-6 flex justify-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <RotateCw className="w-4 h-4 animate-spin" />}
            Save override
          </Button>
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
};
