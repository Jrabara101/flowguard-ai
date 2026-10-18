import React from 'react';
import { Inbox, Bot, BarChart3, ShieldCheck, X } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { navigate } from '../../router';

export const NAV_ITEMS = [
  { id: 'queue', label: 'Action queue', icon: Inbox },
  { id: 'copilot', label: 'Ops copilot', icon: Bot },
  { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
];

export const Sidebar = ({ activeTab, setActiveTab, open, onClose }) => {
  const { orders } = useOrders();
  const pendingCount = orders.filter(o => o.decision.status === 'PENDING').length;

  const go = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-drawer bg-[rgba(34,48,62,0.4)] lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-drawer w-[260px] shrink-0 bg-white shadow-card flex flex-col transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-[72px] px-6 flex items-center gap-3">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-3 rounded" aria-label="FlowGuard home page">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="font-heading font-semibold text-xl text-ink">FlowGuard</span>
          </a>
          <button onClick={onClose} aria-label="Close menu" className="ml-auto lg:hidden p-2 text-body hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-4 py-2 flex flex-col gap-1" aria-label="Main">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 min-h-[44px] rounded-md text-[15px] text-left transition-colors ${
                  active ? 'bg-primary text-white shadow-primary' : 'text-body hover:bg-subtle'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="flex-1">{label}</span>
                {id === 'queue' && pendingCount > 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-white/25 text-white' : 'bg-high-soft text-high-text'}`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto m-4 p-4 rounded-md bg-primary-soft text-[13px] leading-relaxed text-ink">
          <div className="flex items-center gap-2 font-medium mb-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Scored by Gemini
          </div>
          Every order gets a return-risk score before its waybill is printed. All data here is simulated.
        </div>
      </aside>
    </>
  );
};
