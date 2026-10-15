import React, { useState } from 'react';
import { 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShieldAlert, 
  Calendar, 
  Download, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  ArrowDownRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { DASHBOARD_STATS } from '../../data/mockData';
import { ProvinceChart } from './charts/ProvinceChart';
import { RtsTrendChart } from './charts/RtsTrendChart';
import { ProductChart } from './charts/ProductChart';
import { RiskTierDoughnut } from './charts/RiskTierDoughnut';

export const DashboardView = () => {
  const [dateRange, setDateRange] = useState('Oct 1 - Oct 7, 2026');
  const stats = DASHBOARD_STATS.kpis;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-charcoal-950 h-[calc(100vh-65px)]">
      {/* Dashboard Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-extrabold text-white">Fulfillment & RTS Analytics</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 font-semibold">
              Live Backtest Data
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Grounded metrics from 1,250 synthetic COD orders evaluated across J&T and Flash Express delivery corridors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-300">
            <Calendar className="w-3.5 h-3.5 text-gold-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-none text-white font-medium"
            >
              <option value="Oct 1 - Oct 7, 2026" className="bg-charcoal-900">Oct 1 – Oct 7, 2026 (Backtest Week)</option>
              <option value="Sept 24 - Sept 30, 2026" className="bg-charcoal-900">Sept 24 – Sept 30, 2026</option>
              <option value="Last 30 Days" className="bg-charcoal-900">Last 30 Days (Consolidated)</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-xs text-charcoal-400">
            <span>Currency:</span>
            <strong className="text-gold-400">PHP (₱)</strong>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RTS Rate KPI */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 relative overflow-hidden group hover:border-risk-green/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">RTS Rate</span>
            <div className="p-2 rounded-xl bg-risk-green/15 text-risk-green">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-black text-risk-green">{stats.current_rts_rate}%</span>
            <span className="text-xs text-charcoal-500 line-through">15.8%</span>
          </div>

          <div className="mt-2 text-xs flex items-center gap-1 text-risk-green font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-41.8% RTS Reduction</span>
          </div>
          <p className="text-[10px] text-charcoal-500 mt-1">vs historical baseline without AI</p>
        </div>

        {/* Estimated Savings KPI */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 relative overflow-hidden group hover:border-gold-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Estimated Savings</span>
            <div className="p-2 rounded-xl bg-gold-500/15 text-gold-400">
              <span className="font-bold text-sm">₱</span>
            </div>
          </div>

          <div className="text-3xl font-heading font-black text-gold-300">
            ₱{stats.estimated_pesos_saved.toLocaleString()}
          </div>

          <div className="mt-2 text-xs flex items-center gap-1 text-gold-400 font-semibold">
            <span>61 Failed Deliveries Prevented</span>
          </div>
          <p className="text-[10px] text-charcoal-500 mt-1">Includes 2-way shipping & packaging fees</p>
        </div>

        {/* Total Orders Scored */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 relative overflow-hidden group hover:border-charcoal-600 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Orders Scored</span>
            <div className="p-2 rounded-xl bg-charcoal-800 text-charcoal-300">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="text-3xl font-heading font-black text-white">
            {stats.total_orders_scored.toLocaleString()}
          </div>

          <div className="mt-2 text-xs flex items-center gap-1 text-charcoal-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-risk-green" />
            <span>812 Auto-Approved (Loyal)</span>
          </div>
          <p className="text-[10px] text-charcoal-500 mt-1">Average scoring latency: 1.1s</p>
        </div>

        {/* High Risk Intercepted */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 relative overflow-hidden group hover:border-risk-red/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">High Risk Intercepted</span>
            <div className="p-2 rounded-xl bg-risk-red/15 text-risk-red">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="text-3xl font-heading font-black text-risk-red">
            {stats.high_risk_flagged}
          </div>

          <div className="mt-2 text-xs flex items-center gap-1 text-risk-red font-semibold">
            <span>11.0% of Total Orders</span>
          </div>
          <p className="text-[10px] text-charcoal-500 mt-1">Held before waybill printing</p>
        </div>
      </div>

      {/* Main Charts Row 1: Weekly Trend & Province Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly RTS Trend Line Chart */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-bold text-white">RTS Rate Trend Over Time</h3>
              <p className="text-[11px] text-charcoal-400">Baseline without AI vs FlowGuard AI weekly trajectory</p>
            </div>
            <span className="text-xs text-risk-green font-bold bg-risk-green/10 border border-risk-green/20 px-2.5 py-1 rounded-lg">
              -41.8%
            </span>
          </div>

          <RtsTrendChart />
        </div>

        {/* Province RTS Bar Chart */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-bold text-white">RTS Rate by Philippine Province</h3>
              <p className="text-[11px] text-charcoal-400">Courier delivery success trends (Cavite & Rizal highest risk)</p>
            </div>
            <span className="text-xs text-charcoal-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gold-400" />
              <span>Route Bottlenecks</span>
            </span>
          </div>

          <ProvinceChart />
        </div>
      </div>

      {/* Main Charts Row 2: Product RTS & Risk Tier Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Category RTS Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-bold text-white">RTS Rate by Product</h3>
              <p className="text-[11px] text-charcoal-400">Electronics and live-selling items exhibit highest refusal risk</p>
            </div>
            <span className="text-xs text-charcoal-400">Top 6 Products</span>
          </div>

          <ProductChart />
        </div>

        {/* Risk Tier Distribution Doughnut */}
        <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-4">
          <div>
            <h3 className="text-sm font-heading font-bold text-white">Risk Tier Breakdown</h3>
            <p className="text-[11px] text-charcoal-400">Distribution across 1,250 scored orders</p>
          </div>

          <RiskTierDoughnut />
        </div>
      </div>

      {/* Financial Savings Breakdown Card */}
      <div className="p-5 rounded-2xl bg-charcoal-850 border border-charcoal-750 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-heading font-bold text-white">Estimated Financial Impact Breakdown</h3>
            <p className="text-[11px] text-charcoal-400">How ₱184,500 in prevented operational losses is calculated</p>
          </div>
          <span className="text-xs font-bold text-gold-400">₱184,500 Total Saved</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {DASHBOARD_STATS.savings_breakdown.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-charcoal-800 border border-charcoal-700 space-y-1">
              <div className="text-lg font-heading font-bold text-white">₱{item.value.toLocaleString()}</div>
              <div className="text-xs text-charcoal-400 leading-snug">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
