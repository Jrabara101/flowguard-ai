import React from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  Inbox, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  SearchX,
  PlusCircle
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { OrderCard } from './OrderCard';
import { OrderDetailPanel } from './OrderDetailPanel';

export const ActionQueueView = () => {
  const { 
    filteredOrders, 
    selectedOrderId, 
    setSelectedOrderId, 
    selectedOrder, 
    activeRiskFilter, 
    setActiveRiskFilter, 
    sortBy, 
    setSortBy,
    setSimulationModalOpen,
    searchQuery
  } = useOrders();

  const filterTabs = [
    { id: 'ALL', label: 'All Orders' },
    { id: 'PENDING', label: 'Needs Review', icon: Clock },
    { id: 'HIGH', label: 'High Risk', icon: AlertOctagon, color: 'text-risk-red' },
    { id: 'MEDIUM', label: 'Medium', icon: AlertTriangle, color: 'text-risk-amber' },
    { id: 'LOW', label: 'Low', icon: CheckCircle2, color: 'text-risk-green' }
  ];

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-65px)]">
      {/* Left Column: Action Queue List (Master) */}
      <div className="w-full lg:w-[460px] xl:w-[480px] border-r border-charcoal-800 flex flex-col bg-charcoal-900 shrink-0">
        {/* Filter Tabs Bar */}
        <div className="p-4 border-b border-charcoal-800 bg-charcoal-900/60 space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = activeRiskFilter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRiskFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gold-500 text-charcoal-950 shadow-gold-glow'
                      : 'bg-charcoal-800/80 text-charcoal-400 hover:text-white hover:bg-charcoal-750'
                  }`}
                >
                  {Icon && <Icon className={`w-3 h-3 ${isActive ? 'text-charcoal-950' : tab.color || 'text-current'}`} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort bar & Results count */}
          <div className="flex items-center justify-between text-xs text-charcoal-400 pt-1">
            <span>
              Showing <strong className="text-white">{filteredOrders.length}</strong> orders (sorted by risk)
            </span>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-charcoal-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-charcoal-800 border border-charcoal-750 rounded-lg px-2 py-1 text-[11px] text-charcoal-200 focus:outline-none focus:border-gold-500"
              >
                <option value="RISK_DESC">Highest Risk First</option>
                <option value="RISK_ASC">Lowest Risk First</option>
                <option value="AMOUNT_DESC">Highest Amount</option>
                <option value="DATE_DESC">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Order List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-charcoal-400">
              <SearchX className="w-10 h-10 text-charcoal-600 mb-2" />
              <p className="font-semibold text-sm text-white">No matching orders</p>
              <p className="text-xs text-charcoal-500 mt-1">Try clearing your search query or switching filter tabs.</p>
              <button
                onClick={() => setSimulationModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs font-semibold hover:bg-gold-500/30 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Simulate New Order</span>
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isSelected={order.id === selectedOrderId}
                onSelect={() => setSelectedOrderId(order.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Column: Order Detail Panel (Detail) */}
      <div className="flex-1 hidden lg:block bg-charcoal-950 overflow-hidden">
        <OrderDetailPanel order={selectedOrder} />
      </div>
    </div>
  );
};
