import React from 'react';
import { 
  Inbox, 
  Bot, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  UserCheck, 
  SlidersHorizontal,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { orders, setSimulationModalOpen } = useOrders();

  const pendingCount = orders.filter(o => o.decision.status === 'PENDING').length;
  const highRiskCount = orders.filter(o => o.risk_assessment.risk_tier === 'HIGH').length;

  const navItems = [
    {
      id: 'queue',
      label: 'Action Queue',
      icon: Inbox,
      badge: pendingCount,
      badgeColor: 'bg-gold-500/20 text-gold-400 border border-gold-500/30',
      description: 'Review & score COD orders'
    },
    {
      id: 'copilot',
      label: 'Ops Copilot',
      icon: Bot,
      badge: 'AI Pro',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      description: 'Conversational assistant'
    },
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      icon: BarChart3,
      badge: null,
      description: 'RTS rates & savings'
    }
  ];

  return (
    <aside className="w-72 bg-charcoal-900 border-r border-charcoal-800 flex flex-col justify-between shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-charcoal-800 flex items-center gap-3">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="FlowGuard AI" 
              className="w-10 h-10 object-contain rounded-xl p-1 bg-charcoal-800 border border-gold-500/30 shadow-gold-glow"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-base tracking-wide text-white">FlowGuard</span>
              <span className="font-heading font-bold text-xs px-1.5 py-0.5 rounded bg-gold-500 text-charcoal-950">AI</span>
            </div>
            <p className="text-[11px] text-charcoal-400 font-medium">Retail & Commerce · JAPAC</p>
          </div>
        </div>

        {/* Quick Action Simulator Button */}
        <div className="p-4">
          <button
            onClick={() => setSimulationModalOpen(true)}
            className="w-full group flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500/20 via-gold-500/10 to-transparent hover:from-gold-500/30 hover:to-gold-500/15 border border-gold-500/40 text-gold-300 hover:text-gold-200 transition-all shadow-sm hover:shadow-gold-glow text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4 text-gold-400 group-hover:rotate-90 transition-transform duration-300" />
            <span>Simulate Incoming Order</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
            Workflows
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-charcoal-800 text-white border-l-4 border-gold-500 shadow-sm'
                    : 'text-charcoal-300 hover:bg-charcoal-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-gold-500/15 text-gold-400' : 'bg-charcoal-800/80 text-charcoal-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-charcoal-400">{item.description}</div>
                  </div>
                </div>

                {item.badge !== null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-charcoal-700 text-charcoal-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Queue Quick Stats Card */}
        <div className="mx-4 mt-6 p-3.5 rounded-xl bg-charcoal-850/80 border border-charcoal-750">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-charcoal-300">Live Queue Status</span>
            <span className="text-[10px] text-risk-red font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-red animate-ping" />
              {highRiskCount} High Risk
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-charcoal-800/90 p-2 rounded-lg border border-charcoal-700">
              <div className="text-base font-bold text-white">{orders.length}</div>
              <div className="text-[10px] text-charcoal-400">Total Scored</div>
            </div>
            <div className="bg-charcoal-800/90 p-2 rounded-lg border border-charcoal-700">
              <div className="text-base font-bold text-gold-400">{pendingCount}</div>
              <div className="text-[10px] text-charcoal-400">Needs Review</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Gemini Models */}
      <div className="p-4 border-t border-charcoal-800 space-y-3 bg-charcoal-950/40">
        {/* Compliance Tag */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-charcoal-800/60 border border-charcoal-750 text-[10px] text-charcoal-400">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
          <span className="text-gold-400 font-semibold">Simulated Demo</span>
          <span>·</span>
          <span>No live POS needed</span>
        </div>

        {/* AI Infrastructure Badge */}
        <div className="space-y-1.5 text-[10px] text-charcoal-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-charcoal-300">
              <Cpu className="w-3 h-3 text-gold-400" />
              <span>Scoring Engine:</span>
            </span>
            <span className="font-semibold text-white">Gemini Flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-charcoal-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Ops Copilot:</span>
            </span>
            <span className="font-semibold text-white">Gemini Pro</span>
          </div>
        </div>

        {/* Supervisor User Session */}
        <div className="pt-2 border-t border-charcoal-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-charcoal-950 font-bold text-xs">
              SB
            </div>
            <div>
              <div className="font-semibold text-white leading-tight">Teammate B</div>
              <div className="text-[10px] text-charcoal-400">Fulfillment Supervisor</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-risk-green shadow-green-glow" title="Online" />
        </div>
      </div>
    </aside>
  );
};
