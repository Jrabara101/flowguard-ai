import React from 'react';
import { X, MessageSquare, User, Store, Sparkles } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export const ChatDrawer = () => {
  const { selectedOrder, chatDrawerOpen, setChatDrawerOpen } = useOrders();

  if (!chatDrawerOpen || !selectedOrder) return null;

  const conversation = selectedOrder.conversation || [];
  const keyMoments = selectedOrder.risk_assessment?.key_moments || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-charcoal-900 border-l border-charcoal-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold-500/15 text-gold-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-sm">Messenger Transcript</h3>
              <p className="text-[11px] text-charcoal-400">Order #{selectedOrder.id} · {selectedOrder.customer.name}</p>
            </div>
          </div>

          <button
            onClick={() => setChatDrawerOpen(false)}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Callout */}
        <div className="p-4 bg-charcoal-850/80 border-b border-charcoal-800 text-xs text-charcoal-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
          <span>Chat lines highlighted in gold were identified by Gemini as key drivers of the RTS risk judgment.</span>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {conversation.map((msg, idx) => {
            const isBuyer = msg.sender === 'BUYER' || msg.from === 'buyer';
            const isKeyMoment = keyMoments.some(km => km.toLowerCase().includes(msg.message?.toLowerCase() || msg.text?.toLowerCase()));
            const text = msg.message || msg.text;

            return (
              <div 
                key={idx}
                className={`flex flex-col ${isBuyer ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-charcoal-500 mb-1 px-1">
                  {isBuyer ? (
                    <>
                      <User className="w-3 h-3 text-charcoal-400" />
                      <span>Buyer ({selectedOrder.customer.name})</span>
                    </>
                  ) : (
                    <>
                      <span>Shop / Seller</span>
                      <Store className="w-3 h-3 text-gold-400" />
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isBuyer
                      ? isKeyMoment
                        ? 'bg-charcoal-800 border-2 border-gold-500/80 text-white shadow-gold-glow'
                        : 'bg-charcoal-800 border border-charcoal-700 text-charcoal-200'
                      : 'bg-gold-500 text-charcoal-950 font-medium'
                  }`}
                >
                  <p>{text}</p>
                  {isKeyMoment && (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gold-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      Key Risk Moment
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-charcoal-800 bg-charcoal-850 flex items-center justify-between text-xs">
          <span className="text-charcoal-400">Total lines: {conversation.length}</span>
          <button
            onClick={() => setChatDrawerOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-charcoal-800 text-white font-medium hover:bg-charcoal-750 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
