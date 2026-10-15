import React, { createContext, useContext, useState, useMemo } from 'react';
import { INITIAL_ORDERS, SIMULATION_PRESETS } from '../data/mockData';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState(1043); // Start with high-risk order
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

  // Accept AI Recommendation
  const acceptOrder = (orderId, note = '') => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const recommendedAction = o.risk_assessment.recommended_action;
      const newDecision = {
        status: 'ACCEPTED',
        action: recommendedAction,
        actor: 'Supervisor (Ops Team)',
        note: note || `Accepted AI recommendation: ${recommendedAction}`,
        timestamp: new Date().toISOString()
      };
      return {
        ...o,
        decision: newDecision,
        decision_history: [
          ...o.decision_history,
          {
            action: recommendedAction,
            actor: 'Supervisor (Ops Team)',
            overrode_ai: false,
            note: note || `Accepted AI recommendation: ${recommendedAction}`,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }));
    showToast(`Order #${orderId} accepted as ${selectedOrder?.risk_assessment.recommended_action}`, 'success');
  };

  // Override AI Recommendation
  const overrideOrder = (orderId, newAction, note = '') => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newDecision = {
        status: 'OVERRIDDEN',
        action: newAction,
        actor: 'Supervisor (Ops Team)',
        note: note || `Supervisor override to ${newAction}`,
        timestamp: new Date().toISOString()
      };
      return {
        ...o,
        decision: newDecision,
        decision_history: [
          ...o.decision_history,
          {
            action: newAction,
            actor: 'Supervisor (Ops Team)',
            overrode_ai: true,
            note: note || `Supervisor override to ${newAction}`,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }));
    setOverrideModalOpen(false);
    showToast(`Order #${orderId} overridden to ${newAction}`, 'warning');
  };

  // Simulate incoming order with multi-stage scoring
  const simulateIncomingOrder = (presetIndex = 0) => {
    const preset = SIMULATION_PRESETS[presetIndex % SIMULATION_PRESETS.length];
    setIsSimulating(true);
    setSimulationModalOpen(false);

    // Multi-stage scoring animation steps
    setSimulationStep('Connecting to webhook & extracting customer historical signals...');

    setTimeout(() => {
      setSimulationStep('Analyzing Messenger conversation in Taglish & judging buyer intent...');
    }, 600);

    setTimeout(() => {
      setSimulationStep('Parsing Philippine address & verifying courier coverage...');
    }, 1200);

    setTimeout(() => {
      setSimulationStep('Calculating RTS probability with Gemini 1.5 Flash...');
    }, 1800);

    setTimeout(() => {
      const newId = Math.floor(1047 + Math.random() * 50);
      const newOrder = {
        id: newId,
        channel: preset.channel,
        amount: preset.amount,
        payment_type: "COD",
        created_at: new Date().toISOString(),
        items: preset.items,
        raw_address: preset.raw_address,
        customer: {
          name: "Simulated Buyer",
          phone_masked: "09•• ••• " + Math.floor(1000 + Math.random() * 9000),
          phone_hash: "sha256:" + Math.random().toString(36).substring(2, 8),
          total_orders: 1,
          delivered_count: 0,
          rts_count: 1
        },
        signals: {
          customer_total_orders: 1,
          customer_delivered: 0,
          customer_rts: 1,
          past_rts_count: 1,
          order_value_vs_customer_avg: 1.5,
          is_repeat_phone: true,
          phone_seen_on_other_accounts: 1,
          courier_success_rate_destination: 0.89,
          is_cod: true
        },
        conversation: preset.conversation,
        risk_assessment: preset.predicted,
        decision: {
          status: "PENDING",
          action: null,
          actor: null,
          note: null,
          timestamp: null
        },
        decision_history: []
      };

      setOrders(prev => [newOrder, ...prev]);
      setSelectedOrderId(newId);
      setIsSimulating(false);
      setSimulationStep('');
      showToast(`⚡ Order #${newId} scored by Gemini Flash: ${preset.predicted.risk_tier} RISK (${preset.predicted.risk_score}/100)`, 'gold');
    }, 2400);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
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
