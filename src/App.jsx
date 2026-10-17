import React, { useState } from 'react';
import { OrderProvider, useOrders } from './context/OrderContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Topbar } from './components/Layout/Topbar';
import { ActionQueueView } from './components/ActionQueue/ActionQueueView';
import { CopilotView } from './components/Copilot/CopilotView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { OrderDrawer } from './components/ActionQueue/OrderDrawer';
import { OverrideModal } from './components/ActionQueue/OverrideModal';
import { SimulateOrderModal } from './components/ActionQueue/SimulateOrderModal';
import { CheckCircle2, AlertTriangle, Info, Sparkles } from 'lucide-react';

const TOAST_STYLE = {
  success: { icon: CheckCircle2, color: 'text-low-text', bar: 'bg-low' },
  warning: { icon: AlertTriangle, color: 'text-medium-text', bar: 'bg-medium' },
  ai: { icon: Sparkles, color: 'text-primary', bar: 'bg-primary' },
  info: { icon: Info, color: 'text-body', bar: 'bg-line' },
};

const ToastNotification = () => {
  const { toastMessage } = useOrders();
  if (!toastMessage) return null;

  const { message, type } = toastMessage;
  const style = TOAST_STYLE[type] || TOAST_STYLE.info;
  const Icon = style.icon;

  return (
    <div role="status" className="fixed top-5 right-5 z-toast w-[min(360px,calc(100vw-40px))] bg-white rounded-md shadow-pop overflow-hidden animate-pop">
      <div className={`h-1 ${style.bar}`} />
      <div className="flex items-start gap-3 px-4 py-3 text-sm text-ink">
        <Icon className={`w-5 h-5 shrink-0 ${style.color}`} />
        <span>{message}</span>
      </div>
    </div>
  );
};

const LoadBanner = () => {
  const { loadError, reloadQueue } = useOrders();
  if (!loadError) return null;
  return (
    <div role="alert" className="mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-md text-sm bg-high-soft text-high-text flex items-center justify-between gap-3">
      <span>Could not load orders from the server: {loadError}</span>
      <button onClick={reloadQueue} className="font-semibold underline">Retry</button>
    </div>
  );
};

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-canvas text-body font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 min-w-0 overflow-y-auto">
        <Topbar activeTab={activeTab} onMenu={() => setMenuOpen(true)} />
        <LoadBanner />

        <main className="px-4 sm:px-6 py-6">
          {activeTab === 'queue' && <ActionQueueView />}
          {activeTab === 'copilot' && <CopilotView />}
          {activeTab === 'dashboard' && <DashboardView />}
        </main>
      </div>

      <OrderDrawer />
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
