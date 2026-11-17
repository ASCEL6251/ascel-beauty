import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, initLenis, initChrome, initDarkTopbar, lenis } from './ui';
import { buildJar, makeStage } from './jarModel';
import { takePayload, leaveToProduct, prefetch, type TxPayload } from './transition';
import { initFooterPhysics } from './physics';
import { sound } from './sound';
import type { Product } from '../data/products';

gsap.registerPlugin(ScrollTrigger);

export function initProduct() {
  const p: Product = JSON.parse($('#product-data').textContent!);
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  initLenis();
  initChrome();
  initDarkTopbar();

  const viewer = initViewer(p);

  // ---------- intro ----------
  const chars = $$('.pd-the .char, .pd-nick .char');
  gsap.set(chars, { yPercent: 110 });
  gsap.set('.pd-buy, .pd-left', { opacity: 0, y: 40 });
  const reveal = (delay = 0) => {
    gsap.to(chars, { yPercent: 0, stagger: 0.03, duration: 1.1, ease: 'expo.out', delay });
    gsap.to('.pd-buy, .pd-left', { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'expo.out', delay: delay + 0.25 });
  };
  const tx = takePayload();
  const enter = $('.tx-enter');
  document.fonts.ready.then(async () => {
    if (tx && viewer) {
      // live jar takes over exactly where the snapshot left it
      await viewer.handoff(tx);
      gsap.to('.tx-enter__img', { opacity: 0, duration: 0.35, ease: 'power1.out' });
      gsap.to(enter, { opacity: 0, duration: 0.9, ease: 'power2.inOut', delay: 0.1, onComplete: () => { enter.remove(); document.documentElement.classList.remove('tx-in'); } });
      viewer.glideIn();
      reveal(0.35);
    } else {
      enter?.remove();
      document.documentElement.classList.remove('tx-in');
      viewer?.intro();
      reveal();
    }
  });
  $$<HTMLAnchorElement>('.pd-more__item').forEach((a) => a.addEventListener('pointerenter', () => prefetch(a.getAttribute('href')!), { once: true }));

  // ---------- buy box ----------
  const val = $('.pd-price__val'), ml = $('.pd-price__ml'), total = $('.pd-add__total'), qtyEl = $('.pd-qty__val');
  let qty = 1;
  const money = (n: number) => `$${n.toFixed(2)}`;
  const current = () => $<HTMLInputElement>('.pd-sizes input:checked');
  const refresh = () => {
    const c = current();
    const price = parseFloat(c.dataset.price!);
    gsap.fromTo(val, { yPercent: -30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
    val.textContent = money(price);
    ml.textContent = `/ ${c.value} ML`;
    total.textContent = money(price * qty);
    qtyEl.textContent = String(qty);
    viewer?.setScale(c.value === '30' ? 0.85 : c.value === '100' ? 1.15 : 1);
  };
  $$<HTMLInputElement>('.pd-sizes input').forEach((i) => i.addEventListener('change', () => { sound.play('tick'); refresh(); }));
  $('.pd-qty__minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); refresh(); });
  $('.pd-qty__plus').addEventListener('click', () => { qty = Math.min(9, qty + 1); refresh(); });
  const toast = $('.toast');
  $('.pd-add').addEventListener('click', () => {
    sound.play('pop');
    toast.textContent = `Added ${qty} × ${p.name} (${current().value} ml) to your bag — demo store, no checkout.`;
    gsap.killTweensOf(toast);
    gsap.fromTo(toast, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.6)' });
    gsap.to(toast, { y: 80, opacity: 0, delay: 3, duration: 0.5 });
    gsap.fromTo('.pd-add', { scale: 0.94 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, .4)' });
  });

  // ---------- band marquee ----------
  const tp = $<SVGTextPathElement>('.band__text');
  let off = 0, vel = 0;
  lenis?.on('scroll', (l) => (vel = l.velocity));
  gsap.ticker.add(() => { off -= 0.6 + Math.abs(vel) * 0.25; if (off < -1850) off += 1850; tp?.setAttribute('startOffset', String(off)); });

  // ---------- scroll reveals ----------
  $$('[data-reveal]').forEach((el) => {
    const c = $$('.char', el);
    if (c.length) gsap.from(c, { yPercent: 110, opacity: 0, stagger: 0.025, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    else gsap.from(el, { y: 60, opacity: 0, rotate: gsap.utils.random(-4, 4), duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.to('.pd-swirl svg', { rotate: 360, ease: 'none', scrollTrigger: { trigger: '.pd-inside', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.pd-the', { yPercent: -30, ease: 'none', scrollTrigger: { trigger: '.pd-hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.pd-nick', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '.pd-hero', start: 'top top', end: 'bottom top', scrub: true } });

  // ---------- other products ----------
  $$<HTMLAnchorElement>('.pd-more__item').forEach((a) =>
    a.addEventListener('click', (e) => { e.preventDefault(); leaveToProduct(a.getAttribute('href')!, $('.pd-more__lid .lid', a), a.dataset.bg!); }),
  );

  ScrollTrigger.create({ trigger: '.footer', start: 'top 55%', once: true, onEnter: () => initFooterPhysics($('.footer__pile')) });
  addEventListener('load', () => ScrollTrigger.refresh());
}

// ---------------------------------------------------------------
function initViewer(p: Product) {
  const canvas = $<HTMLCanvasElement>('.pd-canvas');
  const box = $('.pd-stage');
  let stage: ReturnType<typeof makeStage>;
  try { stage = makeStage(canvas, 30); } catch { return null; }
  const { renderer, scene, camera } = stage;
  camera.position.set(0, 1.6, 7.4);

  const holder = new THREE.Group();   // intro drop + size scale
  const floater = new THREE.Group();  // idle bob
  holder.add(floater); scene.add(holder);
  const jar = buildJar(p);
  floater.add(jar.root);
  holder.position.y = 6;

  // soft contact shadow
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  const sg = sc.getContext('2d')!;
  const grd = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.45)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grd; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.95; scene.add(shadow);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.15, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false; controls.enableZoom = false;
  controls.rotateSpeed = 0.9;
  controls.minPolarAngle = 0.05; controls.maxPolarAngle = Math.PI - 0.05;
  controls.autoRotate = true; controls.autoRotateSpeed = 1.8;
  controls.update();

  let idleT = 0;
  controls.addEventListener('start', () => {
    controls.autoRotate = false; clearTimeout(idleT);
    gsap.to('.pd-hint', { opacity: 0, duration: 0.4 });
  });
  controls.addEventListener('end', () => { idleT = window.setTimeout(() => (controls.autoRotate = true), 3500); });

  // ----- lid open / close -----
  const lid = jar.lid;
  const closed = { px: 0, py: 0.74, pz: 0, rx: 0, ry: 0, rz: 0 };
  let open = false, animating: gsap.core.Timeline | null = null;
  const btn = $('.pd-open');
  const lookFrom = (phi: number) => {
    const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const o = { phi: s.phi };
    gsap.to(o, { phi, duration: 1.4, ease: 'power3.inOut', onUpdate: () => {
      s.phi = o.phi; camera.position.copy(new THREE.Vector3().setFromSpherical(s).add(controls.target));
    } });
  };
  const setOpen = (v: boolean) => {
    if (v === open) return;
    open = v; animating?.kill();
    sound.play(v ? 'pop' : 'thud');
    btn.setAttribute('aria-pressed', String(v));
    btn.querySelector('span')!.textContent = v ? 'CLOSE LID' : 'OPEN LID';
    const tl = (animating = gsap.timeline());
    const narrow = canvas.clientWidth / canvas.clientHeight < 0.8;
    if (v) {
      tl.to(lid.rotation, { y: -Math.PI * 2.5, duration: 0.9, ease: 'power2.inOut' })            // unscrew
        .to(lid.position, { y: 1.15, duration: 0.9, ease: 'power2.inOut' }, 0)
        .to(lid.position, { x: narrow ? -1.15 : -1.7, y: narrow ? -0.85 : -0.35, z: narrow ? 0.1 : 0.9, duration: 1.0, ease: 'power3.inOut' })     // swing off, lean against the jar
        .to(lid.rotation, { x: 1.2, z: 0.25, duration: 1.0, ease: 'power3.inOut' }, '<')
        .fromTo(jar.cream.scale, { y: 1 }, { y: 1.04, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '<0.4');
      lookFrom(0.75);
    } else {
      tl.to(lid.position, { x: 0, y: 1.15, z: 0, duration: 0.9, ease: 'power3.inOut' })
        .to(lid.rotation, { x: 0, z: 0, duration: 0.9, ease: 'power3.inOut' }, '<')
        .to(lid.position, { y: closed.py, duration: 0.8, ease: 'power2.inOut' })
        .to(lid.rotation, { y: 0, duration: 0.8, ease: 'power2.inOut' }, '<');
      lookFrom(1.35);
    }
  };
  btn.addEventListener('click', () => setOpen(!open));

  // tap (not drag) on the jar toggles the lid
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = { x: 0, y: 0, t: 0 };
  canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY, t: performance.now() }));
  canvas.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || performance.now() - down.t > 400) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(holder, true).length) setOpen(!open);
  });

  // ----- sizing + loop -----
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength(w / h < 0.8 ? 9.2 : 7.4);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(box);
  resize();

  const life = { bob: 1, shadow: 1, base: 1 };
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(box);
  gsap.ticker.add(() => {
    if (!visible) return;
    const t = performance.now() / 1000;
    floater.position.y = Math.sin(t * 1.4) * 0.05 * life.bob;
    floater.rotation.z = Math.sin(t * 0.9) * 0.03 * life.bob;
    shadow.position.set(holder.position.x, holder.position.y - 0.95 * holder.scale.y, holder.position.z);
    shadow.scale.setScalar(holder.scale.x * (1 - floater.position.y * 0.6));
    (shadow.material as THREE.MeshBasicMaterial).opacity = life.shadow;
    controls.update();
    renderer.render(scene, camera);
  });
  document.fonts.ready.then(() => jar.refresh());

  return {
    intro() {
      gsap.fromTo(holder.position, { y: 6 }, { y: 0, duration: 1.5, ease: 'bounce.out' });
      gsap.fromTo(holder.rotation, { y: -Math.PI }, { y: 0, duration: 1.6, ease: 'power3.out' });
      gsap.delayedCall(1.7, () => setOpen(true));
    },
    setScale(s: number) { life.base = s; gsap.to(holder.scale, { x: s, y: s, z: s, duration: 0.8, ease: 'elastic.out(1, .5)' }); },
    /** Place the jar at a screen point/size (from the previous page) and draw that frame. */
    async handoff(d: TxPayload) {
      controls.autoRotate = false;
      life.bob = 0; life.shadow = 0;
      resize();
      const cr = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((d.sx - cr.left) / cr.width) * 2 - 1, -((d.sy - cr.top) / cr.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const n = camera.position.clone().sub(controls.target).normalize();
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, new THREE.Vector3());
      const P = new THREE.Vector3();
      ray.ray.intersectPlane(plane, P);
      const dist = camera.position.distanceTo(P);
      const ppw = cr.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist);
      const sc = d.R / (1.06 * ppw);
      holder.position.copy(P); holder.scale.setScalar(sc); holder.rotation.set(0, 0, 0);
      jar.refresh();
      controls.update(); renderer.render(scene, camera);
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },
    glideIn() {
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      tl.to(holder.position, { x: 0, y: 0, z: 0, duration: 1.3 }, 0)
        .to(holder.scale, { x: life.base, y: life.base, z: life.base, duration: 1.3 }, 0)
        .to(holder.rotation, { y: Math.PI * 2, duration: 1.6, ease: 'power2.inOut' }, 0.1)
        .to(life, { bob: 1, shadow: 1, duration: 1, ease: 'none' }, 0.6)
        .add(() => { holder.rotation.y = 0; setOpen(true); }, 1.55)
        .add(() => { controls.autoRotate = true; }, 3.2);
    },
  };
}
