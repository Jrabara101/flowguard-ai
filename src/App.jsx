import React, { useState } from 'react';
import { OrderProvider, useOrders } from './context/OrderContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { ActionQueueView } from './components/ActionQueue/ActionQueueView';
import { CopilotView } from './components/Copilot/CopilotView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { ChatDrawer } from './components/ActionQueue/ChatDrawer';
import { OverrideModal } from './components/ActionQueue/OverrideModal';
import { SimulateOrderModal } from './components/ActionQueue/SimulateOrderModal';
import { CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';

const ToastNotification = () => {
  const { toastMessage } = useOrders();
  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold ${
        type === 'success' 
          ? 'bg-charcoal-850 border-risk-green/50 text-risk-green' 
          : type === 'warning'
          ? 'bg-charcoal-850 border-risk-amber/50 text-risk-amber'
          : type === 'gold'
          ? 'bg-charcoal-850 border-gold-500/50 text-gold-300 shadow-gold-glow'
          : 'bg-charcoal-850 border-charcoal-700 text-white'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-risk-green shrink-0" />
        ) : type === 'warning' ? (
          <AlertTriangle className="w-4 h-4 text-risk-amber shrink-0" />
        ) : type === 'gold' ? (
          <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-charcoal-300 shrink-0" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <div className="flex h-screen bg-charcoal-950 text-charcoal-100 font-sans overflow-hidden">
      {/* Persistent Brand Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar activeTab={activeTab} />

        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'queue' && <ActionQueueView />}
          {activeTab === 'copilot' && <CopilotView />}
          {activeTab === 'dashboard' && <DashboardView />}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <ChatDrawer />
      <OverrideModal />
      <SimulateOrderModal />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <OrderProvider>
      <MainLayout />
    </OrderProvider>
  );
}
