import React, { useEffect, useState } from 'react';
import { MessageSquareText, MapPin, Send, Bot, ShieldCheck, UserCheck, Lock, Database } from 'lucide-react';
import { api } from '../../api';
import { navigate } from '../../router';
import { WaybillDemo } from './WaybillDemo';

const openDashboard = (e) => {
  e?.preventDefault();
  navigate('/app');
};

const PrimaryCta = ({ children = 'Open the dashboard', className = '' }) => (
  <a
    href="/app"
    onClick={openDashboard}
    className={`inline-flex items-center justify-center min-h-[48px] px-6 rounded-md bg-primary text-white font-medium shadow-primary hover:bg-primary-dark transition-colors cursor-pointer ${className}`}
  >
    {children}
  </a>
);

const STEPS = [
  {
    title: 'An order comes in',
    body: 'Items, the delivery address, the Messenger chat and the buyer’s past orders are gathered before anyone prints a waybill.',
  },
  {
    title: 'Gemini reads it',
    body: 'Gemini Flash scores the return risk from 0 to 100, explains why in plain words and quotes the chat lines behind the score.',
  },
  {
    title: 'Your team decides',
    body: 'Ship now, confirm first or hold. Staff accept the advice or override it with a note, and every decision is logged.',
  },
];

const SEES = [
  { icon: MessageSquareText, title: 'The chat lines that matter', body: '“Wala pa sahod”, a changed address, a buyer who stopped replying: highlighted, not buried.' },
  { icon: MapPin, title: 'Addresses a rider can find', body: 'Barangay, city and landmark pulled out of free text, with missing parts flagged before dispatch.' },
  { icon: Send, title: 'A message ready to send', body: 'A polite Taglish confirmation that asks only for what is missing.' },
  { icon: Bot, title: 'Answers on demand', body: 'Ask the Ops copilot which routes or products return most. It looks up the numbers before it answers.' },
];

const TIER_ROWS = [
  { key: 'LOW', label: 'Low risk, shipped right away', bar: 'bg-low', text: 'text-low-text' },
  { key: 'MEDIUM', label: 'Medium risk, confirm first', bar: 'bg-medium', text: 'text-medium-text' },
  { key: 'HIGH', label: 'High risk, hold', bar: 'bg-high', text: 'text-high-text' },
];

/** Live backtest from the API; a skeleton while it loads, nothing invented if it fails. */
const Results = () => {
  const [bt, setBt] = useState(undefined);

  useEffect(() => {
    api.dashboard().then((d) => setBt(d.backtest)).catch(() => setBt(null));
  }, []);

  const max = bt ? Math.max(...TIER_ROWS.map((r) => bt.by_tier[r.key].rts_rate), 1) : 1;
  const held = bt?.if_high_orders_were_held;

  return (
    <section id="results" className="scroll-mt-24 py-20 sm:py-28 border-t">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16 items-start">
        <div>
          <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-ink leading-tight">Does the score hold up?</h2>
          <p className="mt-4 text-lg leading-relaxed text-body max-w-prose">
            We gave Gemini past orders it had never seen the outcome of, using only what was known when each order was placed,
            then checked which parcels really came back.
          </p>
          {held && (
            <p className="mt-4 text-lg leading-relaxed text-body max-w-prose">
              Holding the high tier would have stopped <strong className="text-ink">{held.share_of_all_rts_caught_pct}% of returns</strong>.
              The trade-off: {held.orders_held_pct}% of orders wait for a confirmation message, which is why FlowGuard confirms instead of cancelling.
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card p-6 sm:p-8">
          <p className="text-sm text-muted">
            {bt ? `Share of orders returned to sender, by tier (${bt.scored_orders} past orders)` : 'Share of orders returned to sender, by tier'}
          </p>
          <div className="mt-6 space-y-6" aria-busy={bt === undefined}>
            {TIER_ROWS.map((r) => {
              const t = bt?.by_tier?.[r.key];
              return (
                <div key={r.key}>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span className="text-ink">{r.label}</span>
                    {t ? (
                      <span className={`font-heading font-semibold text-2xl tabular-nums ${r.text}`}>{t.rts_rate}%</span>
                    ) : (
                      <span className="h-7 w-16 rounded bg-subtle animate-pulse" />
                    )}
                  </div>
                  <div className="h-3 rounded-full bg-subtle overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.bar} origin-left transition-transform duration-700 ease-out`}
                      style={{ transform: `scaleX(${t ? t.rts_rate / max : 0})` }}
                    />
                  </div>
                  {t && <p className="mt-1.5 text-sm text-muted">{t.rts} of {t.orders} orders came back</p>}
                </div>
              );
            })}
          </div>
          {bt === null && <p className="mt-6 text-sm text-muted">Results are shown in the dashboard once the server is reachable.</p>}
          <p className="mt-6 text-xs text-muted">Simulated data. A useful score puts the returns in high and the good orders in low.</p>
        </div>
      </div>
    </section>
  );
};

export const LandingPage = () => {
  useEffect(() => {
    document.title = 'FlowGuard AI: stop return-to-sender before the waybill prints';
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-body font-sans">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-toast focus:bg-white focus:px-3 focus:py-2 focus:rounded">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 px-3 sm:px-6 pt-3">
        <nav className="max-w-6xl mx-auto bg-white/90 backdrop-blur rounded-md shadow-card h-16 px-4 sm:px-5 flex items-center gap-4" aria-label="Main">
          <a href="/" className="flex items-center gap-2.5 mr-auto" aria-label="FlowGuard home">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
            <span className="font-heading font-semibold text-xl text-ink">FlowGuard</span>
          </a>
          <a href="#how" className="hidden sm:inline px-2 py-2 text-[15px] hover:text-ink transition-colors">How it works</a>
          <a href="#results" className="hidden sm:inline px-2 py-2 text-[15px] hover:text-ink transition-colors">Results</a>
          <PrimaryCta className="min-h-[40px] px-4 text-[15px]" />
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-20 grid lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-12 lg:gap-16 items-center">
          <div className="animate-rise">
            <h1 className="font-heading font-semibold text-ink text-[clamp(2.4rem,5.2vw,4.1rem)] leading-[1.06] tracking-[-0.02em]">
              Know which cash-on-delivery parcels will come back before you print the waybill.
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-body max-w-[34em]">
              FlowGuard reads each order’s Messenger chat, address and buyer history with Gemini, then tells your packing team
              to ship now, confirm first or hold.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PrimaryCta />
              <a href="#how" className="inline-flex items-center min-h-[48px] px-5 rounded-md text-ink font-medium hover:bg-white transition-colors">
                See how it scores
              </a>
            </div>
            <p className="mt-6 text-sm text-muted">Built for Philippine social sellers on Messenger, Meta Shops and TikTok Shop. Demo uses simulated orders.</p>
          </div>
          <WaybillDemo />
        </section>

        {/* How it works: a real sequence, so it is numbered */}
        <section id="how" className="scroll-mt-24 py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-ink leading-tight max-w-2xl">
              From new order to decision in about ten seconds
            </h2>
            <ol className="mt-12 grid md:grid-cols-3 gap-10 md:gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative md:pr-6">
                  <span className="font-heading font-semibold text-5xl text-primary/30 tabular-nums" aria-hidden="true">{i + 1}</span>
                  <h3 className="mt-3 font-heading font-semibold text-xl text-ink">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-body max-w-[32em]">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Results />

        {/* What the team sees */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-ink leading-tight max-w-2xl">What your team sees for every order</h2>
            <ul className="mt-12 grid sm:grid-cols-2 gap-x-12">
              {SEES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4 py-6 border-t">
                  <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-medium text-lg text-ink">{title}</h3>
                    <p className="mt-1 leading-relaxed text-body">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Fairness */}
        <section className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16">
            <h2 className="font-heading font-semibold text-3xl sm:text-4xl text-ink leading-tight">It judges the order, never the person</h2>
            <ul className="grid sm:grid-cols-2 gap-6 text-body">
              <li className="flex gap-3"><MapPin className="w-5 h-5 text-primary shrink-0 mt-1" /><span>A city only describes how well couriers deliver there, not the buyers who live there.</span></li>
              <li className="flex gap-3"><UserCheck className="w-5 h-5 text-primary shrink-0 mt-1" /><span>A person makes every final call, and overrides are logged with a reason.</span></li>
              <li className="flex gap-3"><Lock className="w-5 h-5 text-primary shrink-0 mt-1" /><span>Names are masked and phone numbers hashed before anything reaches the model.</span></li>
              <li className="flex gap-3"><Database className="w-5 h-5 text-primary shrink-0 mt-1" /><span>The copilot can only read data. It cannot change an order.</span></li>
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-5 sm:px-8 pb-20">
          <div className="max-w-6xl mx-auto rounded-lg bg-ink text-white px-6 sm:px-12 py-12 sm:py-16 flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <h2 className="font-heading font-semibold text-3xl sm:text-4xl leading-tight">See today’s action queue</h2>
              <p className="mt-3 text-lg text-white/80 max-w-xl">Score a new order live, read Gemini’s reasons and ask the copilot why an order is on hold.</p>
            </div>
            <PrimaryCta className="self-start md:self-auto" />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-sm text-muted">
          <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> FlowGuard AI, built with Gemini on Vertex AI and Cloud Run</p>
          <p>Google Cloud AI Builder Cup 2026. All demo data is simulated.</p>
        </div>
      </footer>
    </div>
  );
};
