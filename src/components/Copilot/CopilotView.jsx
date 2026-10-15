import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Database, 
  TrendingDown, 
  MapPin, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { COPILOT_KNOWLEDGE } from '../../data/mockData';
import { useOrders } from '../../context/OrderContext';

export const CopilotView = () => {
  const { orders } = useOrders();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Kumusta! I am your FlowGuard Ops Copilot, powered by Gemini 1.5 Pro with function calling. Ask me about regional RTS rates, specific order holds, product delivery performance, or estimated savings.",
      tools_used: [],
      data: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 2,
      sender: 'user',
      text: "Which provinces had the highest RTS rate this week?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 3,
      sender: 'assistant',
      text: "Cavite had the highest RTS rate this week at 15.0%, with 48 RTS orders out of 320 total orders. Rizal followed closely at 12.38% (26 RTS out of 210 orders). In contrast, Metro Manila and Laguna routes showed the highest delivery success rates at ~92–93%.",
      tools_used: ["get_region_trends"],
      data: {
        province: "Cavite",
        city: "Bacoor",
        rts_rate: 15.0,
        rts_orders: 48,
        total_orders: 320,
        top_provinces: COPILOT_KNOWLEDGE.get_region_trends
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sampleQuestions = [
    "Which provinces had the highest RTS rate this week?",
    "Why is order #1043 on hold?",
    "What is our overall RTS summary and estimated savings?",
    "Which products have the highest RTS risk?",
    "Show me orders needing supervisor confirmation"
  ];

  const handleSend = (textToSend) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsThinking(true);

    // Simulate Gemini Pro function calling reasoning
    setTimeout(() => {
      let answer = '';
      let tools_used = [];
      let data = null;
      const lower = query.toLowerCase();

      if (lower.includes('province') || lower.includes('region') || lower.includes('cavite') || lower.includes('laguna')) {
        tools_used = ["get_region_trends"];
        answer = "Cavite recorded the highest RTS rate this week at 15.0% (48 RTS orders out of 320), followed by Rizal at 12.38%. Route congestion along the Molino corridor and missing landmarks in new subdivisions are the primary courier delay drivers.";
        data = {
          type: 'regions',
          list: COPILOT_KNOWLEDGE.get_region_trends
        };
      } else if (lower.includes('1043') || (lower.includes('hold') && lower.includes('order'))) {
        tools_used = ["get_order_details"];
        const o1043 = orders.find(o => o.id === 1043);
        answer = `Order #1043 (₱1,849 COD, Rochelle M.) is on HOLD because the buyer explicitly asked in Messenger to delay delivery until payday ('wala pa sahod hehe') and warned she might not be home. The customer also has 2 previous return-to-sender parcels on record.`;
        data = {
          type: 'order',
          order: o1043 || orders[0]
        };
      } else if (lower.includes('1042') || lower.includes('air fryer')) {
        tools_used = ["get_order_details"];
        const o1042 = orders.find(o => o.id === 1042);
        answer = `Order #1042 (Air Fryer 5L, ₱1,899 COD) is flagged as CONFIRM_FIRST. The buyer engaged in price-shopping comparisons ('wala na po less? sa iba 1.7k lang') and the delivery address is missing both the official Barangay and a courier landmark on Rizal St.`;
        data = {
          type: 'order',
          order: o1042 || orders[1]
        };
      } else if (lower.includes('product') || lower.includes('earbuds') || lower.includes('items')) {
        tools_used = ["get_product_rts_rate"];
        answer = "Wireless Earbuds Pro has the highest product RTS rate at 15.0% (48 failed deliveries out of 320), followed by Bluetooth Speaker XB-20 at 12.31%. High-value electronics with impulse live-selling purchases represent our highest cancellation risk.";
        data = {
          type: 'products',
          list: COPILOT_KNOWLEDGE.get_product_rts_rate
        };
      } else if (lower.includes('summary') || lower.includes('saving') || lower.includes('rts rate')) {
        tools_used = ["get_rts_summary"];
        answer = "For the period Oct 1 – Oct 7, 2026, FlowGuard AI scored 1,250 total COD orders. The RTS rate dropped to 10.96% (137 RTS orders) vs a 15.8% baseline. This represents 61 prevented failed deliveries and ₱68,500 in direct two-way courier fee savings.";
        data = {
          type: 'summary',
          summary: COPILOT_KNOWLEDGE.get_rts_summary
        };
      } else {
        tools_used = ["get_orders_by_risk"];
        const pendingCount = orders.filter(o => o.decision.status === 'PENDING').length;
        answer = `Currently, there are ${pendingCount} orders awaiting supervisor action in the queue. High-risk orders such as #1043 and #1046 are currently held until buyer confirmation, preventing an estimated ₱5,348 in potential return-to-sender losses.`;
        data = {
          type: 'summary',
          summary: COPILOT_KNOWLEDGE.get_rts_summary
        };
      }

      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: answer,
        tools_used,
        data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 900);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-65px)] bg-charcoal-950 overflow-hidden">
      {/* Top Banner Info */}
      <div className="px-6 py-3 border-b border-charcoal-800 bg-charcoal-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-sm text-white">FlowGuard Ops Copilot</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Gemini 1.5 Pro
              </span>
            </div>
            <p className="text-[11px] text-charcoal-400">Grounded with read-only database tools: get_region_trends, get_order_details, get_rts_summary</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-charcoal-400">
          <div className="w-2 h-2 rounded-full bg-risk-green animate-pulse" />
          <span>Tool Calling Active</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-charcoal-500">
              {msg.sender === 'user' ? (
                <span>Supervisor (You) · {msg.timestamp}</span>
              ) : (
                <span className="flex items-center gap-1.5 text-gold-400 font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>Gemini Ops Copilot · {msg.timestamp}</span>
                </span>
              )}
            </div>

            <div
              className={`max-w-3xl p-4 rounded-2xl text-xs leading-relaxed space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-gold-500 text-charcoal-950 font-medium ml-12'
                  : 'bg-charcoal-850 border border-charcoal-750 text-charcoal-100 mr-12 shadow-md'
              }`}
            >
              <p className="text-sm">{msg.text}</p>

              {/* Tool Execution Badge (Matches API Contract) */}
              {msg.tools_used && msg.tools_used.length > 0 && (
                <div className="pt-2 border-t border-charcoal-750 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-charcoal-400 uppercase tracking-wider">
                    Tools Executed:
                  </span>
                  {msg.tools_used.map((tool, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-300 font-mono text-[10px]"
                    >
                      <Database className="w-3 h-3 text-gold-400" />
                      <span>{tool}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Structured Data Visualizer Card */}
              {msg.data && (
                <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-800 overflow-x-auto text-[11px]">
                  {msg.data.type === 'regions' || msg.data.top_provinces ? (
                    <div>
                      <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gold-400" />
                        <span>Province RTS Performance Breakdown</span>
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-charcoal-400 border-b border-charcoal-800">
                            <th className="pb-1">Province</th>
                            <th className="pb-1">RTS Rate</th>
                            <th className="pb-1">RTS Orders</th>
                            <th className="pb-1">Total</th>
                            <th className="pb-1">Route Factor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-charcoal-800 text-charcoal-200">
                          {(msg.data.list || msg.data.top_provinces || []).map((p, i) => (
                            <tr key={i} className="hover:bg-charcoal-850">
                              <td className="py-1.5 font-semibold text-white">{p.province}</td>
                              <td className={`py-1.5 font-bold ${p.rts_rate > 10 ? 'text-risk-red' : 'text-risk-green'}`}>
                                {p.rts_rate}%
                              </td>
                              <td className="py-1.5">{p.rts_orders}</td>
                              <td className="py-1.5">{p.total_orders}</td>
                              <td className="py-1.5 text-charcoal-400 text-[10px]">{p.courier_notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : msg.data.type === 'products' ? (
                    <div>
                      <div className="font-bold text-white mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gold-400" />
                        <span>Product Category RTS Statistics</span>
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-charcoal-400 border-b border-charcoal-800">
                            <th className="pb-1">Product Name</th>
                            <th className="pb-1">Category</th>
                            <th className="pb-1">RTS Rate</th>
                            <th className="pb-1">Failed Parcels</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-charcoal-800 text-charcoal-200">
                          {msg.data.list.map((prod, i) => (
                            <tr key={i}>
                              <td className="py-1.5 font-semibold text-white">{prod.product_name}</td>
                              <td className="py-1.5 text-charcoal-400">{prod.category}</td>
                              <td className={`py-1.5 font-bold ${prod.rts_rate > 10 ? 'text-risk-red' : 'text-risk-green'}`}>
                                {prod.rts_rate}%
                              </td>
                              <td className="py-1.5">{prod.rts_orders} / {prod.total_orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : msg.data.type === 'summary' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2 rounded bg-charcoal-800">
                        <span className="text-[10px] text-charcoal-400 block">Total Orders</span>
                        <strong className="text-white text-xs">{msg.data.summary.total_orders}</strong>
                      </div>
                      <div className="p-2 rounded bg-charcoal-800">
                        <span className="text-[10px] text-charcoal-400 block">Current RTS Rate</span>
                        <strong className="text-risk-green text-xs">{msg.data.summary.rts_rate}%</strong>
                      </div>
                      <div className="p-2 rounded bg-charcoal-800">
                        <span className="text-[10px] text-charcoal-400 block">Baseline Rate</span>
                        <strong className="text-charcoal-400 text-xs line-through">{msg.data.summary.baseline_rts_rate}%</strong>
                      </div>
                      <div className="p-2 rounded bg-charcoal-800">
                        <span className="text-[10px] text-charcoal-400 block">Est. Savings</span>
                        <strong className="text-gold-300 text-xs">₱{msg.data.summary.estimated_savings.toLocaleString()}</strong>
                      </div>
                    </div>
                  ) : msg.data.type === 'order' && msg.data.order ? (
                    <div className="space-y-1">
                      <div className="font-bold text-white">Order #{msg.data.order.id} Breakdown:</div>
                      <div className="text-charcoal-300">
                        Risk Score: <strong className="text-risk-red">{msg.data.order.risk_assessment.risk_score} ({msg.data.order.risk_assessment.risk_tier})</strong> · Action: <strong>{msg.data.order.risk_assessment.recommended_action}</strong>
                      </div>
                      <div className="text-charcoal-400 italic">"{msg.data.order.risk_assessment.reasons[0]}"</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-charcoal-850 border border-charcoal-750 max-w-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-gold-400 animate-spin" />
            <div className="text-xs text-charcoal-300">
              <span className="font-semibold text-white">Gemini 1.5 Pro</span> is selecting read-only tools...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Questions Carousel */}
      <div className="px-6 py-2.5 bg-charcoal-900 border-t border-charcoal-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 shrink-0">
            Suggested:
          </span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 border border-charcoal-700 hover:border-gold-500/40 text-xs text-charcoal-300 hover:text-white whitespace-nowrap transition-all shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-charcoal-900 border-t border-charcoal-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 max-w-5xl mx-auto"
        >
          <input
            type="text"
            placeholder="Ask Copilot e.g., 'Which courier routes have the highest RTS?', 'Why is order #1043 held?'"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-gold-500/70 focus:ring-1 focus:ring-gold-500/40"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isThinking}
            className={`p-3 rounded-xl transition-all ${
              !inputPrompt.trim() || isThinking
                ? 'bg-charcoal-800 text-charcoal-600 cursor-not-allowed'
                : 'bg-gold-500 hover:bg-gold-400 text-charcoal-950 shadow-gold-glow'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
