import { revealDelayMs } from './motion.ts';

/**
 * Scroll-triggered section reveal with ONE shared IntersectionObserver and no React state.
 *
 *   <section {...revealProps(2)} className="mo-reveal ...">
 *
 * The element starts as data-reveal="pending" (CSS: transparent, nudged down) and is flipped to "shown" once,
 * the first time it is on screen; it then plays a transform/opacity entrance and is never hidden again.
 * Without IntersectionObserver, or with reduced motion, it is "static" from the start (visible, no animation). A timer reveals anything
 * still pending after 2.5 s IF the observer has never reported anything (i.e. it is broken), so content can never stay
 * hidden; a working observer keeps far-below sections pending until they are actually scrolled to.
 */
const SAFETY_MS = 2500;

function canAnimate(): boolean {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return false;
  return !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
/** 'static' = no observer or reduced motion: visible from the start and never animated */
export const REVEAL_INITIAL: 'pending' | 'static' = canAnimate() ? 'pending' : 'static';

const registered = new Map<Element, { at: number; timer: number }>();
let observer: IntersectionObserver | null = null;
let observerAlive = false; // set by the first report from the observer; if it never comes, reveal everything

function show(el: HTMLElement) {
  const info = registered.get(el);
  if (info) window.clearTimeout(info.timer);
  const waited = info ? performance.now() - info.at : Infinity;
  const order = Number(el.dataset.revealOrder ?? 0);
  el.style.setProperty('--mo-delay', `${revealDelayMs(order, waited)}ms`);
  el.dataset.reveal = 'shown';
  registered.delete(el);
  observer?.unobserve(el);
}

/** drop elements that left the page before they were ever seen, and stop observing when nothing is left */
function prune() {
  for (const [el, info] of registered) {
    if (!el.isConnected) { window.clearTimeout(info.timer); registered.delete(el); observer?.unobserve(el); }
  }
  if (registered.size === 0 && observer) { observer.disconnect(); observer = null; }
}

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      observerAlive = true;
      for (const e of entries) if (e.isIntersecting) show(e.target as HTMLElement);
      prune();
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  }
  return observer;
}

/** one stable callback ref for every revealed element (the order comes from data-reveal-order) */
export function revealRef(el: HTMLElement | null): void {
  if (!el) { prune(); return; }
  if (el.dataset.reveal !== 'pending' || registered.has(el)) return;
  const timer = window.setTimeout(() => { if (!observerAlive && el.dataset.reveal === 'pending') show(el); }, SAFETY_MS);
  registered.set(el, { at: performance.now(), timer });
  getObserver().observe(el);
}

export function revealProps(order = 0) {
  return { ref: revealRef, 'data-reveal': REVEAL_INITIAL, 'data-reveal-order': order } as const;
}
