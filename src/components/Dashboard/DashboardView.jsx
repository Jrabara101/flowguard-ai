import React, { useEffect, useState } from 'react';
import { TrendingDown, ShieldCheck, AlertTriangle, Wallet, RefreshCw, Info } from 'lucide-react';
import { api } from '../../api';
import { Button, Card, TIER, peso } from '../ui';
import { ProvinceChart } from './charts/ProvinceChart';
import { RtsTrendChart } from './charts/RtsTrendChart';
import { ProductChart } from './charts/ProductChart';
import { RiskTierDoughnut } from './charts/RiskTierDoughnut';

const Kpi = ({ icon: Icon, tone, label, value, line, note }) => (
  <div className="bg-white rounded-md shadow-card p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[13px] text-muted">{label}</div>
        <div className="font-heading font-medium text-[26px] text-ink leading-tight mt-1">{value}</div>
      </div>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="mt-3 text-sm text-ink">{line}</div>
    <p className="text-xs text-muted mt-1">{note}</p>
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
      <div className="bg-white rounded-md shadow-card p-10 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-high-text" />
        <p className="text-ink">Could not load the dashboard: {error}</p>
        <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4" /> Retry</Button>
      </div>
    );
  }

  if (!stats) {
    return <div className="bg-white rounded-md shadow-card p-10 text-center text-muted">Loading analytics…</div>;
  }

  const { overall, backtest: bt, weekly, routes, products, queue } = stats;
  const held = bt?.if_high_orders_were_held;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading font-medium text-2xl text-ink">Analytics</h1>
          <p className="mt-1">
            {overall.resolved_orders.toLocaleString()} past COD orders with known outcomes, {overall.from} to {overall.to}.
            {bt && ` Gemini scored ${bt.scored_orders} of them using only what was known when each order was placed.`}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-medium-soft text-medium-text">Backtest · simulated data</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Kpi
          icon={AlertTriangle} tone="bg-high-soft text-high-text"
          label="RTS rate without FlowGuard" value={`${overall.rts_rate}%`}
          line={`${overall.rts_orders.toLocaleString()} of ${overall.resolved_orders.toLocaleString()} orders returned`}
          note={`${peso(overall.shipping_lost_php)} shipping lost on returns`}
        />
        {bt && (
          <>
            <Kpi
              icon={ShieldCheck} tone="bg-low-soft text-low-text"
              label="Returns caught" value={`${held.share_of_all_rts_caught_pct}%`}
              line="of all returns landed in the High tier"
              note={`Trade-off: ${held.orders_held_pct}% of orders wait for confirmation`}
            />
            <Kpi
              icon={TrendingDown} tone="bg-primary-soft text-primary"
              label="RTS if High is held" value={`${held.rts_rate_of_orders_shipped}%`}
              line={`down from ${bt.overall_rts_rate}% when every order ships`}
              note="Return rate of the orders FlowGuard ships right away"
            />
            <Kpi
              icon={Wallet} tone="bg-medium-soft text-medium-text"
              label="Shipping saved" value={peso(bt.extrapolated_to_all_orders.shipping_saved_php)}
              line={`${peso(held.shipping_saved_php)} in the ${bt.scored_orders}-order sample`}
              note={`Scaled to all ${bt.extrapolated_to_all_orders.orders_in_book.toLocaleString()} orders`}
            />
          </>
        )}
      </div>

      {!bt && (
        <div className="flex gap-2 p-4 rounded-md bg-primary-soft text-ink text-sm">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>No backtest yet. Run <code className="font-mono">php artisan flowguard:backtest --sample=150</code> to score past orders with Gemini.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Weekly RTS rate" subtitle="Actual returns per week. The dashed line is the backtest result.">
          <RtsTrendChart weekly={weekly} shippedRate={held ? held.rts_rate_of_orders_shipped : null} />
        </Card>
        <Card title="RTS rate by courier route" subtitle={`Top ${routes.length} routes, last 90 days. Describes courier performance, not buyers.`}>
          <ProvinceChart regions={routes} average={overall.rts_rate} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="RTS rate by product" subtitle={`Top ${products.length}, last 90 days, highest first`}>
          <ProductChart products={products} />
        </Card>
        <Card title="Risk tiers" subtitle={bt ? 'How Gemini sorted past orders' : 'Open orders by tier'}>
          {bt
            ? <RiskTierDoughnut counts={{ LOW: bt.by_tier.LOW.orders, MEDIUM: bt.by_tier.MEDIUM.orders, HIGH: bt.by_tier.HIGH.orders }} label="Past orders scored" />
            : <RiskTierDoughnut counts={queue.by_tier} label="Open orders scored" />}
        </Card>
      </div>

      {bt && (
        <Card
          title="Does the risk score work?"
          subtitle="Each tier's real return rate. A useful score puts the returns in High and the good orders in Low."
          right={<span className="hidden sm:block text-xs text-muted">Model: {bt.models.join(', ')}</span>}
          bodyClass=""
        >
          <div className="overflow-x-auto mt-4">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-subtle text-left text-xs text-ink">
                  <th className="px-5 py-3 font-semibold">Tier</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                  <th className="px-3 py-3 font-semibold text-right">Orders</th>
                  <th className="px-3 py-3 font-semibold text-right">Returned</th>
                  <th className="px-5 py-3 font-semibold w-[40%]">Return rate</th>
                </tr>
              </thead>
              <tbody>
                {[['LOW', 'Ship now'], ['MEDIUM', 'Confirm first'], ['HIGH', 'Hold and confirm']].map(([tier, action]) => {
                  const row = bt.by_tier[tier];
                  return (
                    <tr key={tier} className="border-t border-line">
                      <td className={`px-5 py-3 font-medium ${TIER[tier].text}`}>{TIER[tier].label}</td>
                      <td className="px-3 py-3">{action}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.orders}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row.rts}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-12 font-semibold tabular-nums ${TIER[tier].text}`}>{row.rts_rate}%</span>
                          <div className="flex-1 h-1.5 rounded-full bg-subtle" aria-hidden="true">
                            <div className={`h-1.5 rounded-full ${TIER[tier].bar}`} style={{ width: `${Math.min(row.rts_rate * 2, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-4 border-t border-line text-[13px] leading-relaxed">
            Holding the High tier would have stopped {held.of_which_would_have_returned} returns. {held.delivered_orders_held_for_confirmation} orders
            that would have been delivered also wait for a confirmation message, which is why FlowGuard asks the buyer to confirm instead of cancelling.
          </p>
        </Card>
      )}
    </div>
  );
};
