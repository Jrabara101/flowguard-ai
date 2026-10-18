import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Filter, CornerDownLeft } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { matchesQuery, filterSuggestions, highlight } from '../../search';
import { TIER, peso } from '../ui';
import { navigate, TAB_PATHS } from '../../router';

const Mark = ({ text, q }) =>
  highlight(text, q).map((p, i) =>
    p.hit ? <mark key={i} className="bg-primary-soft text-ink rounded-sm px-0.5">{p.text}</mark> : <span key={i}>{p.text}</span>
  );

/**
 * Search for the whole dashboard. On the action queue it filters the table as you type; from any tab,
 * picking a suggestion opens that order. Press / or Ctrl+K to focus, arrows to move, Enter to open, Esc to clear.
 */
export const SearchBox = ({ activeTab }) => {
  const { orders, searchQuery, setSearchQuery, openOrder, setActiveRiskFilter } = useOrders();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const q = searchQuery.trim();
  const filters = useMemo(() => filterSuggestions(q), [q]);
  const matches = useMemo(() => (q ? orders.filter((o) => matchesQuery(o, q)).slice(0, 6) : []), [orders, q]);
  const options = [...filters.map((f) => ({ type: 'filter', f })), ...matches.map((o) => ({ type: 'order', o }))];

  // Keyboard shortcut: "/" or Ctrl/Cmd+K focuses search unless the person is typing somewhere else
  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => setActive(0), [q]);

  const choose = (opt) => {
    if (!opt) return;
    if (activeTab !== 'queue') navigate(TAB_PATHS.queue);
    if (opt.type === 'filter') {
      setActiveRiskFilter(opt.f.id);
      setSearchQuery('');
    } else {
      openOrder(opt.o.id);
    }
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(options[active]); }
    else if (e.key === 'Escape') {
      if (searchQuery) setSearchQuery(''); else inputRef.current?.blur();
      setOpen(false);
    }
  };

  // Ideas for an empty result, taken from the real queue so they always find something
  const ideas = useMemo(() => {
    const first = orders[0];
    if (!first) return [];
    const city = first.risk_assessment?.parsed_address?.city;
    return [`${first.id}`, city, first.items?.[0]?.name, 'high'].filter(Boolean).slice(0, 4);
  }, [orders]);

  const showPanel = open && q.length > 0;
  const listId = 'search-suggestions';

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0">
      <label className="flex items-center gap-2 text-muted">
        <Search className="w-[18px] h-[18px] shrink-0" />
        <span className="sr-only">Search orders</span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && options[active] ? `opt-${active}` : undefined}
          placeholder={activeTab === 'queue' ? 'Search order, buyer, item, city or risk' : 'Jump to an order'}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full py-2 bg-transparent text-ink placeholder:text-muted focus:outline-none"
        />
        {searchQuery ? (
          <button type="button" onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }} aria-label="Clear search" className="p-1.5 rounded hover:bg-subtle hover:text-ink cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="hidden md:inline text-[11px] font-sans px-1.5 py-0.5 rounded border text-muted">/</kbd>
        )}
      </label>

      {showPanel && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[480px] top-[calc(100%+10px)] -mx-1 bg-white rounded-md shadow-pop overflow-hidden animate-pop z-drawer">
          {options.length > 0 ? (
            <ul id={listId} role="listbox" className="py-1.5 max-h-[60vh] overflow-y-auto">
              {options.map((opt, i) => {
                const selected = i === active;
                const base = `flex items-center gap-3 px-4 py-2.5 cursor-pointer ${selected ? 'bg-primary-soft' : 'hover:bg-subtle'}`;
                if (opt.type === 'filter') {
                  return (
                    <li key={opt.f.id} id={`opt-${i}`} role="option" aria-selected={selected} className={base} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); choose(opt); }}>
                      <Filter className="w-4 h-4 text-primary" />
                      <span className="text-ink">Show {opt.f.label.toLowerCase()}</span>
                    </li>
                  );
                }
                const o = opt.o;
                const a = o.risk_assessment;
                const tier = TIER[a.risk_tier];
                const place = [a.parsed_address?.city, a.parsed_address?.province].filter(Boolean).join(', ');
                return (
                  <li key={o.id} id={`opt-${i}`} role="option" aria-selected={selected} className={base} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); choose(opt); }}>
                    <span className={`shrink-0 w-10 text-center text-xs font-semibold py-1 rounded ${tier.soft} ${tier.text}`}>{a.risk_score}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink truncate">
                        <span className="font-mono"><Mark text={`#${o.id}`} q={q} /></span>{' '}
                        <Mark text={o.customer.name} q={q} /> · <Mark text={o.items.map((it) => it.name).join(', ')} q={q} />
                      </span>
                      <span className="block text-xs text-muted truncate"><Mark text={place || o.raw_address} q={q} /> · {peso(o.amount)} · {tier.label} risk</span>
                    </span>
                    {selected && <CornerDownLeft className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-4 text-sm">
              <p className="text-ink">No orders match “{q}”.</p>
              {ideas.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-muted">
                  <span>Try</span>
                  {ideas.map((idea) => (
                    <button key={idea} type="button" onMouseDown={(e) => { e.preventDefault(); setSearchQuery(idea); }} className="px-2 py-1 rounded bg-subtle text-ink hover:bg-primary-soft cursor-pointer">
                      {idea}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="hidden sm:flex px-4 py-2 border-t text-[11px] text-muted gap-4">
            <span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to clear</span>
          </p>
        </div>
      )}
    </div>
  );
};
