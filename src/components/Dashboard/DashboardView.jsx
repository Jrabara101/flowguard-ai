import React, { useEffect, useState } from 'react';
import {
  TrendingDown,
  ShieldAlert,
  MapPin,
  Sparkles,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { ProvinceChart } from './charts/ProvinceChart';
import { RtsTrendChart } from './charts/RtsTrendChart';
import { ProductChart } from './charts/ProductChart';
import { RiskTierDoughnut } from './charts/RiskTierDoughnut';

const peso = (n) => `₱${Math.round(n).toLocaleString()}`;

const Card = ({ title, subtitle, right, children, className = '' }) => (
  <div className={`p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-4 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-heading font-bold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-charcoal-400">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Kpi = ({ label, value, valueClass, line, note, icon: Icon, iconClass }) => (
  <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">{label}</span>
      <div className={`p-2 rounded-xl ${iconClass}`}><Icon className="w-4 h-4" /></div>
    </div>
    <div className={`text-3xl font-heading font-black ${valueClass}`}>{value}</div>
    <div className="mt-2 text-xs font-semibold text-charcoal-200">{line}</div>
    <p className="text-[10px] text-charcoal-500 mt-1">{note}</p>
  </div>
);

export const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      setStats(await api.dashboard());
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-charcoal-400 text-sm">
        <AlertTriangle className="w-8 h-8 text-risk-red" />
        <span>Could not load the dashboard: {error}</span>
        <button onClick={load} className="px-4 py-2 rounded-xl bg-charcoal-800 text-white text-xs flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
      </div>
    );
  }

  if (!stats) {
    return <div className="flex-1 flex items-center justify-center text-charcoal-400 text-sm">Loading analytics…</div>;
  }

  const { overall, backtest: bt, weekly, routes, products, queue } = stats;
  const held = bt?.if_high_orders_were_held;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-charcoal-950 h-[calc(100vh-65px)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-extrabold text-white">Fulfillment & RTS Analytics</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 font-semibold">
              Backtest · Synthetic Data
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            {overall.resolved_orders.toLocaleString()} past COD orders with known outcomes ({overall.from} to {overall.to})
            {bt && <>; Gemini Flash scored {bt.scored_orders} of them using only what was known when each order was placed</>}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-[11px] text-charcoal-400 max-w-sm">
          <Info className="w-3.5 h-3.5 text-gold-400 shrink-0" />
          <span>{stats.data_note} Held orders are confirmed with the buyer first, not cancelled.</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="RTS Rate Today" value={`${overall.rts_rate}%`} valueClass="text-risk-red"
          line={`${overall.rts_orders.toLocaleString()} of ${overall.resolved_orders.toLocaleString()} orders returned`}
          note={`${peso(overall.shipping_lost_php)} shipping lost on returns, before FlowGuard`}
          icon={AlertTriangle} iconClass="bg-risk-red/15 text-risk-red"
        />
        {bt && (
          <>
            <Kpi
              label="Returns Caught" value={`${held.share_of_all_rts_caught_pct}%`} valueClass="text-risk-green"
              line={`of all returns were in the HIGH tier`}
              note={`Trade-off: ${held.orders_held_pct}% of orders held for confirmation`}
              icon={ShieldAlert} iconClass="bg-risk-green/15 text-risk-green"
            />
            <Kpi
              label="RTS If HIGH Held" value={`${held.rts_rate_of_orders_shipped}%`} valueClass="text-gold-300"
              line={`vs ${bt.overall_rts_rate}% when every order ships`}
              note="RTS rate of the orders FlowGuard would ship right away"
              icon={TrendingDown} iconClass="bg-gold-500/15 text-gold-400"
            />
            <Kpi
              label="Shipping Saved" value={peso(bt.extrapolated_to_all_orders.shipping_saved_php)} valueClass="text-white"
              line={`${peso(held.shipping_saved_php)} in the ${bt.scored_orders}-order sample`}
              note={`Scaled to all ${bt.extrapolated_to_all_orders.orders_in_book.toLocaleString()} orders · ${peso(held.cod_value_protected_php)} COD value protected in sample`}
              icon={Sparkles} iconClass="bg-charcoal-800 text-gold-300"
            />
          </>
        )}
      </div>

      {!bt && (
        <div className="p-4 rounded-2xl bg-charcoal-850 border border-gold-500/30 text-xs text-charcoal-300">
          No backtest yet. Run <code className="text-gold-300">php artisan flowguard:backtest --sample=150</code> to score past orders with Gemini.
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly RTS Rate" subtitle="Actual returns per week, with the backtest result as a reference line">
          <RtsTrendChart weekly={weekly} shippedRate={held ? held.rts_rate_of_orders_shipped : null} />
        </Card>
        <Card
          title="RTS Rate by Courier Route"
          subtitle="Delivery success on a route (city, province), last 90 days. Describes courier performance, not buyers."
          right={<span className="text-xs text-charcoal-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gold-400" /> Top {routes.length}</span>}
        >
          <ProvinceChart regions={routes} average={overall.rts_rate} />
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="RTS Rate by Product" subtitle="Last 90 days, highest first" right={<span className="text-xs text-charcoal-400">Top {products.length}</span>}>
          <ProductChart products={products} />
        </Card>
        <Card title="Backtest Risk Tiers" subtitle="How Gemini sorted past orders it had never seen the outcome of">
          {bt
            ? <RiskTierDoughnut counts={{ LOW: bt.by_tier.LOW.orders, MEDIUM: bt.by_tier.MEDIUM.orders, HIGH: bt.by_tier.HIGH.orders }} label="Past Orders Scored" />
            : <RiskTierDoughnut counts={queue.by_tier} label="Open Orders Scored" />}
        </Card>
      </div>

      {/* Backtest table */}
      {bt && (
        <Card
          title="Does the Risk Score Work? Backtest by Tier"
          subtitle="Each tier's real return rate. A useful score puts the returns in HIGH and the good orders in LOW."
          right={<span className="text-[10px] text-charcoal-500">Model: {bt.models.join(', ')}</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              ['LOW', 'Ship now', 'text-risk-green', 'border-risk-green/30'],
              ['MEDIUM', 'Confirm first', 'text-risk-amber', 'border-risk-amber/30'],
              ['HIGH', 'Hold and confirm', 'text-risk-red', 'border-risk-red/30'],
            ].map(([tier, action, color, border]) => (
              <div key={tier} className={`p-4 rounded-xl bg-charcoal-800 border ${border}`}>
                <div className={`text-xs font-bold ${color}`}>{tier} · {action}</div>
                <div className={`text-2xl font-heading font-black mt-1 ${color}`}>{bt.by_tier[tier].rts_rate}%</div>
                <div className="text-[11px] text-charcoal-400">returned ({bt.by_tier[tier].rts} of {bt.by_tier[tier].orders} orders)</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-charcoal-400 leading-relaxed">
            Holding the HIGH tier would have stopped {held.of_which_would_have_returned} returns, but {held.delivered_orders_held_for_confirmation} orders
            that would have been delivered also wait for a confirmation message. That is why FlowGuard asks the buyer to confirm instead of cancelling.
          </p>
        </Card>
      )}
    </div>
  );
};
