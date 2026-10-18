import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Database } from 'lucide-react';
import { api } from '../../api';
import { RiskBadge, actionLabel, peso } from '../ui';

const SAMPLE_QUESTIONS = [
  'Which provinces had the highest RTS rate this week?',
  'Why is order #2029 on hold?',
  'What is our overall RTS summary and estimated savings?',
  'Which products have the highest RTS risk?',
  'Show me orders needing supervisor confirmation',
];

const rateClass = (rate) => (rate > 10 ? 'text-high-text' : 'text-low-text');

const DataTable = ({ head, rows }) => (
  <div className="overflow-x-auto rounded-md border border-line">
    <table className="w-full text-[13px]">
      <thead>
        <tr className="bg-subtle text-left text-ink">
          {head.map((h, i) => <th key={i} className={`px-3 py-2 font-semibold ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

// The structured result Gemini's tools returned, shown under the answer.
const DataCard = ({ data }) => {
  if (data.type === 'regions') {
    return (
      <DataTable
        head={['Route', 'RTS rate', 'Returned', 'Orders']}
        rows={data.list.map((p, i) => (
          <tr key={i} className="border-t border-line">
            <td className="px-3 py-2 text-ink">{p.province}</td>
            <td className={`px-3 py-2 text-right font-medium ${rateClass(p.rts_rate)}`}>{p.rts_rate}%</td>
            <td className="px-3 py-2 text-right">{p.rts_orders}</td>
            <td className="px-3 py-2 text-right">{p.total_orders}</td>
          </tr>
        ))}
      />
    );
  }
  if (data.type === 'products') {
    return (
      <DataTable
        head={['Product', 'RTS rate', 'Returned / orders']}
        rows={data.list.map((p, i) => (
          <tr key={i} className="border-t border-line">
            <td className="px-3 py-2 text-ink">{p.product_name}</td>
            <td className={`px-3 py-2 text-right font-medium ${rateClass(p.rts_rate)}`}>{p.rts_rate}%</td>
            <td className="px-3 py-2 text-right">{p.rts_orders} / {p.total_orders}</td>
          </tr>
        ))}
      />
    );
  }
  if (data.type === 'summary') {
    const s = data.summary;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ['Orders', s.total_orders],
          ['RTS rate', `${s.rts_rate}%`],
          ['Returned', s.rts_orders],
          ['Est. savings', peso(s.estimated_savings)],
        ].map(([label, value]) => (
          <div key={label} className="p-3 rounded-md bg-subtle">
            <div className="text-xs text-muted">{label}</div>
            <div className="font-medium text-ink">{value}</div>
          </div>
        ))}
      </div>
    );
  }
  if (data.type === 'order') {
    const o = data.order;
    const a = o.risk_assessment;
    return (
      <div className="p-3 rounded-md border border-line space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[13px] text-ink">#{o.id}</span>
          <RiskBadge tier={a.risk_tier} score={a.risk_score} />
          <span className="text-[13px]">Suggested: {actionLabel(a.recommended_action)}</span>
        </div>
        {a.reasons?.[0] && <p className="text-[13px] text-muted">{a.reasons[0]}</p>}
      </div>
    );
  }
  return null;
};

export const CopilotView = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Kumusta! I am your FlowGuard Ops Copilot, powered by Gemini Pro. Ask me about RTS rates by province, why an order is on hold, which products return most, or how much we have saved.',
      tools_used: [],
      data: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isThinking]);

  // Turns the backend's tool results into the card the message shows.
  const toCard = (tools, data) => {
    if (!data) return null;
    const pick = (name) => (tools.length === 1 ? data : data[name]);
    const regions = pick('get_region_trends')?.regions;
    if (regions) {
      return {
        type: 'regions',
        list: regions.slice(0, 8).map((r) => ({
          ...r,
          province: [r.city, r.province].filter(Boolean).join(', '),
        })),
      };
    }
    const products = pick('get_product_rts_rate')?.products;
    if (products) return { type: 'products', list: products.slice(0, 8) };
    const summary = pick('get_rts_summary');
    if (summary?.total_orders != null) return { type: 'summary', summary };
    const detail = pick('get_order_details');
    if (detail?.order && detail.risk_assessment) return { type: 'order', order: { ...detail.order, risk_assessment: detail.risk_assessment } };
    return null;
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isThinking) return;

    const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: query, timestamp: stamp() }]);
    setInputPrompt('');
    setIsThinking(true);

    try {
      const res = await api.copilot(query);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        // Gemini answers in Markdown; this view shows plain text, so drop the bold markers and turn bullets into dots.
        text: res.answer.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^\s*[*-]\s+/gm, '• '),
        tools_used: res.tools_used || [],
        data: toCard(res.tools_used || [], res.data),
        timestamp: stamp(),
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `Could not reach Gemini (${e.message}). Send the question again.`,
        tools_used: [],
        data: null,
        timestamp: stamp(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-medium text-2xl text-ink">Ops copilot</h1>
        <p className="mt-1">Ask about orders, routes and savings. Gemini Pro answers from the order database with read-only tools.</p>
      </div>

      <section className="bg-white rounded-md shadow-card flex flex-col h-[calc(100vh-230px)] min-h-[480px]">
        <div className="px-5 py-3.5 border-b border-line flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-medium text-ink">FlowGuard Copilot</h2>
            <p className="text-xs text-muted">Gemini Pro · can look up regions, orders, products and RTS summary</p>
          </div>
          <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-xs text-low-text">
            <span className="w-2 h-2 rounded-full bg-low" aria-hidden="true" /> Online
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-canvas/50" aria-live="polite">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${isUser ? 'bg-primary text-white' : 'bg-white text-primary shadow-card'}`}>
                  {isUser ? 'You' : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={`max-w-[min(720px,85%)] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-md space-y-3 ${isUser ? 'bg-primary text-white' : 'bg-white text-ink shadow-card'}`}>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    {msg.data && <DataCard data={msg.data} />}
                    {msg.tools_used?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs text-muted">Looked up:</span>
                        {msg.tools_used.map((tool, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-subtle text-body font-mono text-[11px]">
                            <Database className="w-3 h-3" /> {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-muted mt-1">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-primary shadow-card flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="px-4 py-3 rounded-md bg-white shadow-card text-muted">Gemini is choosing which data to look up…</div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <div className="px-5 pt-3 flex gap-2 overflow-x-auto border-t border-line">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={isThinking}
              className="shrink-0 px-3 py-1.5 rounded-full border border-line text-[13px] text-body hover:border-primary hover:text-primary disabled:opacity-50 whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="p-4 flex items-center gap-3"
        >
          <label htmlFor="copilot-input" className="sr-only">Ask Copilot</label>
          <input
            id="copilot-input"
            type="text"
            placeholder="Ask about an order, a province or a product"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 min-h-[44px] rounded-md border border-line px-4 text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isThinking}
            aria-label="Send"
            className="min-h-[44px] px-4 rounded-md bg-primary text-white shadow-primary hover:bg-primary-dark disabled:opacity-50 disabled:shadow-none inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>
    </div>
  );
};
