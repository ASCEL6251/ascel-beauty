import gsap from 'gsap';
import type Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initJar } from './jar';
import { initFooterPhysics } from './physics';
import { sound } from './sound';
import { $, $$, initLenis, initChrome, initDarkTopbar, scrollToTarget } from './ui';
import { leaveToProduct, prefetch } from './transition';

export function init() {
  document.body.classList.add('is-loading');
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const lenis = initLenis(true);
  initChrome();
  const returning = sessionStorage.getItem('sl-seen') === '1';
  sessionStorage.setItem('sl-seen', '1');
  const jar = initJar();

  // ---------- preloader → intro ----------
  const heroChars = $$('.hero__title .char');
  gsap.set(heroChars, { yPercent: 110, rotate: 8 });
  gsap.set('.hero__kicker > *', { y: 30, opacity: 0 });
  const ready = Promise.all([document.fonts.ready, new Promise((r) => setTimeout(r, returning ? 150 : 900))]);
  ready.then(() => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (returning) tl.to('.preloader', { yPercent: -100, duration: 0.8, ease: 'expo.inOut' });
    else tl.to('.preloader .logo', { scale: 1, duration: 0.9, ease: 'back.out(2.2)' })
      .to('.preloader .logo', { scale: 0.9, duration: 0.25, ease: 'power2.in' }, '+=.25')
      .to('.preloader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' });
    tl
      .to('.hero__kicker > *', { y: 0, opacity: 1, stagger: 0.08, duration: 1 }, '-=.45')
      .to(heroChars, { yPercent: 0, rotate: 0, stagger: 0.035, duration: 1.2 }, '<')
      .add(() => jar?.drop(), '-=1.1')
      .add(() => {
        document.body.classList.remove('is-loading');
        $('.preloader').remove();
        lenis?.start();
        ScrollTrigger.refresh();
        if (location.hash.length > 1 && document.querySelector(location.hash)) scrollToTarget(location.hash, true);
      }, '-=.6');
  });

  // ---------- hero scroll ----------
  gsap.to('.hero__title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=900', scrub: true } });
  $$('[data-speed]').forEach((el) => {
    const s = parseFloat(el.dataset.speed!);
    gsap.fromTo(el, { y: () => -s * 500 }, { y: () => s * 500, ease: 'none', scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
  gsap.from('.todo, .pattern, .gift', { rotate: (i) => [-18, 14, -14][i], scale: 0.85, ease: 'back.out(1.6)', duration: 1.2, stagger: 0.1, scrollTrigger: { trigger: '.collage', start: 'top 80%' } });
  gsap.to('.kraft .char', { opacity: 1, stagger: 0.02, ease: 'none', scrollTrigger: { trigger: '.kraft', start: 'top 75%', end: 'bottom 45%', scrub: true } });

  initDarkTopbar();

  // ---------- wave band ----------
  const tp = $<SVGTextPathElement>('.band__text');
  if (tp) {
    let off = 0, vel = 0;
    lenis?.on('scroll', (l: Lenis) => (vel = l.velocity));
    gsap.ticker.add(() => {
      off -= 0.6 + Math.abs(vel) * 0.25;
      if (off < -1850) off += 1850;
      tp.setAttribute('startOffset', String(off));
    });
  }

  initFamily();
  initMoments();

  // ---------- CTA ----------
  gsap.from('.cta__pile-item', { y: -500, rotate: () => gsap.utils.random(-90, 90), opacity: 0, ease: 'bounce.out', duration: 1.4, stagger: 0.09, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
  gsap.from('.cta__panel h2 .char', { yPercent: 100, opacity: 0, stagger: 0.03, ease: 'expo.out', duration: 1, scrollTrigger: { trigger: '.cta__panel', start: 'top 75%' } });
  gsap.from('.cta__pile, .cta__panel', { scale: 0.9, borderRadius: 200, ease: 'expo.out', duration: 1.4, stagger: 0.1, scrollTrigger: { trigger: '.cta', start: 'top 80%' } });

  // ---------- footer ----------
  gsap.from('.footer__big .char', { yPercent: 100, stagger: 0.03, ease: 'expo.out', duration: 1.2, scrollTrigger: { trigger: '.footer', start: 'top 60%' } });
  ScrollTrigger.create({ trigger: '.footer', start: 'top 55%', once: true, onEnter: () => initFooterPhysics($('.footer__pile')) });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// ---------------------------------------------------------------
function initFamily() {
  const root = $('.fam');
  const data = JSON.parse($('#products-data').textContent!);
  const lids = $$('.fam__lid .lid');
  const rail = $$('.fam__rail button');
  const n = data.length;
  let cur = 0, busy = false;

  lids.forEach((l, i) => gsap.set(l, { opacity: i === 0 ? 1 : 0, rotate: 0 }));
  const apply = (i: number) => {
    document.documentElement.style.setProperty('--slide-bg', data[i].bg);
    document.documentElement.style.setProperty('--slide-accent', data[i].accent);
  };
  apply(0);

  const go = (next: number) => {
    next = (next + n) % n;
    if (next === cur || busy) return;
    busy = true;
    const dir = next > cur ? 1 : -1;
    const out = $$(`[data-slide="${cur}"]`, root);
    const inn = $$(`[data-slide="${next}"]`, root);
    sound.play('pop');
    apply(next);
    rail.forEach((b, i) => { b.classList.toggle('is-active', i === next); b.setAttribute('aria-selected', String(i === next)); });
    $('.fam__cur').textContent = String(next + 1).padStart(2, '0');

    const tl = gsap.timeline({ onComplete: () => { busy = false; } });
    tl.to(out.flatMap((el) => $$('.char', el)), { yPercent: -110 * dir, opacity: 0, stagger: 0.015, duration: 0.35, ease: 'power3.in' }, 0)
      .to(out.filter((el) => el.classList.contains('fam__cards') || !el.querySelector('.char')), { opacity: 0, y: -20, duration: 0.3 }, 0)
      .to(lids[cur], { rotate: -140 * dir, scale: 0.6, opacity: 0, duration: 0.55, ease: 'power3.in' }, 0)
      .add(() => { out.forEach((el) => (el.hidden = true)); inn.forEach((el) => (el.hidden = false)); })
      .fromTo(inn.flatMap((el) => $$('.char', el)), { yPercent: 110 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.025, duration: 0.8, ease: 'expo.out' })
      .fromTo(inn.filter((el) => !el.querySelector('.char') || el.classList.contains('fam__cards')), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '<')
      .fromTo(inn.filter((el) => el.classList.contains('fam__cards')).flatMap((el) => $$('.fam__card', el)), { scale: 0.4, rotate: (i) => (i ? 40 : -40) }, { scale: 1, rotate: (i) => (i ? 8 : -9), duration: 0.9, ease: 'back.out(1.6)', stagger: 0.06 }, '<')
      .fromTo(lids[next], { rotate: 160 * dir, scale: 0.5, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'elastic.out(1, .6)' }, '<');
    cur = next;
    $<HTMLAnchorElement>('.explore').href = `/products/${data[next].id}`;
    prefetch(`/products/${data[next].id}`);
  };

  const explore = $<HTMLAnchorElement>('.explore');
  ScrollTrigger.create({ trigger: root, start: 'top 80%', once: true, onEnter: () => prefetch(`/products/${data[cur].id}`) });
  const open = () => leaveToProduct(`/products/${data[cur].id}`, lids[cur], data[cur].bg);
  rail.forEach((b) => b.addEventListener('click', () => (+b.dataset.go! === cur ? open() : go(+b.dataset.go!))));
  $('.fam__lid').addEventListener('click', (e) => { e.stopPropagation(); if (!busy) open(); });
  explore.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); open(); }, true);
  $('.fam__next').addEventListener('click', () => go(cur + 1));
  $('.fam__prev').addEventListener('click', () => go(cur - 1));
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
  // swipe
  let sx = 0;
  root.addEventListener('pointerdown', (e) => (sx = e.clientX));
  root.addEventListener('pointerup', (e) => { const dx = e.clientX - sx; if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1)); });

  // idle float + scroll parallax on lid
  gsap.to('.fam__lid', { y: -14, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.fromTo('.fam__lid', { rotate: -25 }, { rotate: 12, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.fam__the .char, .fam__nick .char', { yPercent: 110, stagger: 0.03, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: root, start: 'top 60%' } });
  gsap.from('.fam__card', { scale: 0.3, rotate: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: 0.1, scrollTrigger: { trigger: root, start: 'top 55%' } });
}

// ---------------------------------------------------------------
function initMoments() {
  gsap.to('.moments__head .char', { opacity: 1, translate: '0 0', stagger: 0.015, ease: 'expo.out', duration: 1, scrollTrigger: { trigger: '.moments__head', start: 'top 70%' } });

  const track = $('.moments__track');
  const pin = $('.moments__pin');
  const dist = () => track.scrollWidth - innerWidth;
  const tween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  $$('.mo__card').forEach((c) =>
    gsap.fromTo(c, { rotate: -14, scale: 0.75 }, { rotate: 10, scale: 1.05, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }),
  );
  $$('.mo__lid').forEach((l) => {
    const px = parseFloat(l.dataset.px!);
    gsap.fromTo(l, { x: () => -px * 600, rotate: -px * 200 }, { x: () => px * 600, rotate: px * 200, ease: 'none', scrollTrigger: { trigger: l, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
  });
  $$('.mo__note').forEach((nn) => gsap.from(nn, { opacity: 0, y: 30, scrollTrigger: { trigger: nn, containerAnimation: tween, start: 'left 85%', toggleActions: 'play none none reverse' } }));
}
