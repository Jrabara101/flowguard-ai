import React from 'react';
import { Zap, MessageSquare, MapPin, Gauge } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { Button, Modal } from '../ui';

const STEPS = [
  { icon: MessageSquare, text: 'Reads the buyer\'s Messenger chat, in Taglish, to judge intent.' },
  { icon: MapPin, text: 'Breaks the address into parts and checks the courier route.' },
  { icon: Gauge, text: 'Gives a 0–100 return-risk score and a suggested action.' },
];

export const SimulateOrderModal = () => {
  const { simulationModalOpen, setSimulationModalOpen, simulateIncomingOrder } = useOrders();
  const close = () => setSimulationModalOpen(false);

  return (
    <Modal open={simulationModalOpen} onClose={close} labelledBy="simulate-title" maxWidth="max-w-md">
      <div className="px-7 pt-7 pb-6">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary-soft text-primary flex items-center justify-center">
          <Zap className="w-6 h-6" />
        </div>
        <h2 id="simulate-title" className="font-heading font-medium text-xl text-ink text-center">Score a new order</h2>
        <p className="mt-1 text-center text-sm">
          Takes the next incoming order from the store and sends it to Gemini Flash. It takes about 10 seconds.
        </p>

        <ol className="mt-6 space-y-3">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-8 h-8 shrink-0 rounded-full bg-subtle text-primary flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex justify-center gap-3">
          <Button onClick={() => simulateIncomingOrder()}>
            <Zap className="w-4 h-4" />
            Score order
          </Button>
          <Button variant="secondary" onClick={close}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};
