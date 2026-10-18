import { useEffect, useState } from 'react';

// A very small router: "/" is the landing page, "/app/..." is the dashboard.
// Nginx (and Vite in dev) serve index.html for every path, so deep links like /app/analytics work.

const EVENT = 'flowguard:navigate';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Change the URL without reloading. Uses the View Transitions API for a cross-fade where the browser has it. */
export function navigate(path, { replace = false } = {}) {
  if (path === window.location.pathname) return;
  const apply = () => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    window.dispatchEvent(new Event(EVENT));
  };
  if (document.startViewTransition && !reducedMotion()) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
  window.scrollTo({ top: 0 });
}

export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);
  return path;
}

// Dashboard tabs <-> URLs
export const TAB_PATHS = { queue: '/app', copilot: '/app/copilot', dashboard: '/app/analytics' };

export const tabFromPath = (path) =>
  Object.entries(TAB_PATHS).find(([, p]) => p === path.replace(/\/+$/, ''))?.[0] || 'queue';
