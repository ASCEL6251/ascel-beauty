import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { sound } from './sound';

gsap.registerPlugin(ScrollTrigger);

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

export let lenis: Lenis | null = null;

export function initLenis(startStopped = false) {
  if (reduce) return null;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  if (startStopped) lenis.stop();
  (window as any).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTarget(target: string | number, immediate = false) {
  if (lenis) return lenis.scrollTo(target as any, { duration: 1.6, immediate });
  if (typeof target === 'number') window.scrollTo({ top: target });
  else document.querySelector(target)?.scrollIntoView();
}

export function bindAnchors() {
  $$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      if (id.length < 2) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(id === '#main' ? 0 : id);
    }),
  );
}

export function initCursor() {
  if (!fine) return;
  document.body.classList.add('has-cursor');
  const c = $('.cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const rp = { ...pos };
  addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; });
  gsap.ticker.add(() => {
    rp.x += (pos.x - rp.x) * 0.18; rp.y += (pos.y - rp.y) * 0.18;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    ring.style.transform = `translate(${rp.x}px, ${rp.y}px)`;
  });
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest('a, button, [data-cursor]') as HTMLElement | null;
    c.classList.toggle('is-hover', !!t);
    ring.textContent = t ? (t.dataset.cursor ?? '') : '';
    if (t) sound.play('tick');
  });
}

export let closeMenu = () => {};
export function initMenu() {
  const btn = $('.pull');
  const menu = $('#menu');
  if (!btn || !menu) return;
  const set = (open: boolean) => {
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) sound.play('pop');
  };
  closeMenu = () => set(false);
  btn.addEventListener('click', () => set(!menu.classList.contains('is-open')));
  $('.menu__close').addEventListener('click', () => set(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
}

export function initDarkTopbar() {
  const topbar = $('.topbar');
  const cursorEl = $('.cursor');
  $$('[data-theme="dark"]').forEach((el) =>
    ScrollTrigger.create({
      trigger: el, start: 'top 40px', end: 'bottom 40px',
      onToggle: (st) => { topbar.classList.toggle('is-dark', st.isActive); cursorEl?.classList.toggle('is-dark', st.isActive); },
    }),
  );
}

export function initChrome() {
  sound.bind();
  initCursor();
  initMenu();
  bindAnchors();
}
