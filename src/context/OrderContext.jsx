import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../api';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState('');
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [activeRiskFilter, setActiveRiskFilter] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW, PENDING
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('RISK_DESC'); // RISK_DESC, RISK_ASC, AMOUNT_DESC, DATE_DESC

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = order.id.toString().includes(q);
          const matchCustomer = order.customer.name.toLowerCase().includes(q);
          const matchChannel = order.channel.toLowerCase().includes(q);
          const matchItems = order.items.some(i => i.name.toLowerCase().includes(q));
          const matchAddress = order.raw_address.toLowerCase().includes(q);
          if (!matchId && !matchCustomer && !matchChannel && !matchItems && !matchAddress) {
            return false;
          }
        }

        // Filter by risk tier / status
        if (activeRiskFilter === 'ALL') return true;
        if (activeRiskFilter === 'PENDING') return order.decision.status === 'PENDING';
        if (activeRiskFilter === 'HIGH') return order.risk_assessment.risk_tier === 'HIGH';
        if (activeRiskFilter === 'MEDIUM') return order.risk_assessment.risk_tier === 'MEDIUM';
        if (activeRiskFilter === 'LOW') return order.risk_assessment.risk_tier === 'LOW';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'RISK_DESC') {
          return b.risk_assessment.risk_score - a.risk_assessment.risk_score;
        }
        if (sortBy === 'RISK_ASC') {
          return a.risk_assessment.risk_score - b.risk_assessment.risk_score;
        }
        if (sortBy === 'AMOUNT_DESC') {
          return b.amount - a.amount;
        }
        if (sortBy === 'DATE_DESC') {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return 0;
      });
  }, [orders, searchQuery, activeRiskFilter, sortBy]);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.queue();
      setOrders(list);
      setLoadError(null);
      // Start on the riskiest order so the first screen shows the AI at work.
      setSelectedOrderId((cur) => cur ?? [...list].sort((x, y) => y.risk_assessment.risk_score - x.risk_assessment.risk_score)[0]?.id ?? null);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const replaceOrder = (updated) => setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));

  // Accept AI Recommendation
  const acceptOrder = async (orderId) => {
    try {
      const updated = await api.decide(orderId);
      replaceOrder(updated);
      showToast(`Order #${orderId} accepted as ${updated.decision.action}`, 'success');
    } catch (e) {
      showToast(e.message, 'warning');
    }
  };

  // Override AI Recommendation
  const overrideOrder = async (orderId, newAction, note = '') => {
    try {
      const updated = await api.decide(orderId, newAction, note);
      replaceOrder(updated);
      setOverrideModalOpen(false);
      showToast(`Order #${orderId} overridden to ${newAction}`, 'warning');
    } catch (e) {
      showToast(e.message, 'warning');
    }
  };

  // Gemini Flash scores the next incoming order. The stage messages are only progress text while we wait (7-10 s).
  const simulateIncomingOrder = async () => {
    setIsSimulating(true);
    setSimulationModalOpen(false);
    const stages = [
      'Receiving the new order and extracting customer history signals...',
      'Reading the Messenger chat in Taglish and judging buyer intent...',
      'Parsing the Philippine address and checking route performance...',
      'Gemini Flash is scoring the RTS risk...',
    ];
    let i = 0;
    setSimulationStep(stages[0]);
    const timer = setInterval(() => { i = Math.min(i + 1, stages.length - 1); setSimulationStep(stages[i]); }, 2200);

    try {
      const order = await api.simulate();
      setOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
      setSelectedOrderId(order.id);
      const a = order.risk_assessment;
      showToast(`Order #${order.id} scored by Gemini Flash: ${a.risk_tier} RISK (${a.risk_score}/100)`, 'gold');
    } catch (e) {
      showToast(e.message, 'warning');
    } finally {
      clearInterval(timer);
      setIsSimulating(false);
      setSimulationStep('');
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        loadError,
        reloadQueue: loadQueue,
        filteredOrders,
        selectedOrder,
        selectedOrderId,
        setSelectedOrderId,
        isSimulating,
        simulationStep,
        simulationModalOpen,
        setSimulationModalOpen,
        chatDrawerOpen,
        setChatDrawerOpen,
        overrideModalOpen,
        setOverrideModalOpen,
        activeRiskFilter,
        setActiveRiskFilter,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        acceptOrder,
        overrideOrder,
        simulateIncomingOrder,
        showToast,
        toastMessage
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
