import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { reducedMotion } from '../../router';

// The landing page's one orchestrated moment: an example order is read, scored and stamped.
// Steps: 0 slip, 1-3 chat lines appear, 4 Gemini marks the risky line, 5 score counts up, 6 stamp lands.
const CHAT = [
  { from: 'buyer', text: 'mine po yung ring light at speaker' },
  { from: 'seller', text: 'Noted po! ₱1,849 COD. Ship na po namin bukas?' },
  { from: 'buyer', text: 'pwede bang next week na lang? wala pa kasi sahod hehe', risky: true },
];
const SCORE = 87;
const TIMELINE = [400, 1100, 1800, 2700, 3400, 4600]; // ms at which steps 1..6 start

export const WaybillDemo = () => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [run, setRun] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    if (reducedMotion()) {
      setStep(6);
      setScore(SCORE);
      return undefined;
    }
    setStep(0);
    setScore(0);
    timers.current = TIMELINE.map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.current.forEach(clearTimeout);
  }, [run]);

  // Count the score up once Gemini has "read" the chat. The stamp step always shows the final score,
  // even if the browser paused the animation (background tab).
  useEffect(() => {
    if (step >= 6) setScore(SCORE);
    if (step !== 5 || reducedMotion()) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 900);
      setScore(Math.round(SCORE * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  return (
    <figure className="relative" aria-label="Example: FlowGuard reads an order's chat, scores it 87 out of 100 and stamps it hold">
      <div className="relative bg-white rounded-lg shadow-pop overflow-hidden">
        {/* Waybill header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-dashed">
          <div>
            <p className="text-xs text-muted">Waybill draft, not printed yet</p>
            <p className="font-mono text-lg text-ink">Order #1043</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Collect on delivery</p>
            <p className="font-heading font-semibold text-xl text-ink">₱1,849</p>
          </div>
        </div>
        <div className="px-5 py-3 grid grid-cols-[1fr_auto] gap-4 items-center border-b border-dashed">
          <div className="text-sm leading-snug">
            <p className="text-ink font-medium">R. M.</p>
            <p className="text-body">Purok 3, Brgy. San Isidro, Cabuyao, Laguna</p>
          </div>
          <div className="barcode w-24 h-9 opacity-80" aria-hidden="true" />
        </div>

        {/* Chat */}
        <div className="px-5 py-4 space-y-2 min-h-[176px] bg-subtle">
          <p className="text-xs text-muted flex items-center gap-1.5">Messenger chat</p>
          {CHAT.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.from === 'buyer' ? 'justify-start' : 'justify-end'} transition-all duration-300 ${
                step > i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <p
                className={`max-w-[85%] text-sm px-3 py-2 rounded-2xl transition-colors duration-500 ${
                  m.from === 'buyer' ? 'bg-white text-ink rounded-bl-sm' : 'bg-primary text-white rounded-br-sm'
                } ${m.risky && step >= 4 ? 'ring-2 ring-medium bg-medium-soft' : ''}`}
              >
                {m.text}
              </p>
            </div>
          ))}
          <p className={`text-xs text-medium-text flex items-center gap-1.5 transition-opacity duration-300 ${step >= 4 ? 'opacity-100' : 'opacity-0'}`}>
            <Sparkles className="w-3.5 h-3.5" /> Gemini: buyer wants to wait for payday
          </p>
        </div>

        {/* Score, with a slot for the stamp so it never covers the slip's text */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm text-body">Return risk</span>
              <span className="font-heading font-semibold text-2xl text-ink tabular-nums" aria-live="polite">
                {score}<span className="text-sm text-muted font-sans font-normal"> / 100</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-subtle overflow-hidden">
              <div className="h-full rounded-full bg-high" style={{ width: `${score}%`, transition: 'width 120ms linear' }} />
            </div>
          </div>
          <div className="w-[136px] h-[64px] shrink-0 flex items-center justify-center" aria-hidden="true">
            {step >= 6 && (
              <div className="animate-stamp">
                <div className="border-[3px] border-high-text text-high-text rounded-md px-3 py-1.5 -rotate-6">
                  <p className="font-heading font-semibold text-2xl leading-none">HOLD</p>
                  <p className="text-[11px] font-medium mt-0.5 whitespace-nowrap">Confirm with buyer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <figcaption className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>Example order from the demo data</span>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 -mr-2 rounded hover:text-ink hover:bg-white cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Replay
        </button>
      </figcaption>
    </figure>
  );
};
