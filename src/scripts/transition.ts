import * as THREE from 'three';
import gsap from 'gsap';
import { lenis } from './ui';
import { sound } from './sound';
import { buildJar, makeStage } from './jarModel';
import { products } from '../data/products';

export const TX_KEY = 'sl-tx';
/** Camera elevation used by the product-page viewer (camera (0,1.6,7.4) → target (0,.15,0)). */
export const VIEW_ELEV = Math.atan2(1.45, 7.4);
/** Lid radius in model units (outer ridge). */
const LID_R = 1.06;

export type TxPayload = { id: string; color: string; img: string; sx: number; sy: number; R: number; t: number };

let leaving = false;

export function prefetch(url: string) {
  if (document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'prefetch'; l.href = url;
  document.head.appendChild(l);
}

/**
 * 3D cap-dive: the flat lid is swapped for the real 3D jar at the same spot. It unscrews,
 * then tips from top-down to a 3/4 view (revealing the glass jar) while sinking slowly and
 * the product colour floods out. The last frame is handed to the product page as a snapshot
 * so the page swap is invisible.
 */
export async function leaveToProduct(url: string, source: Element, color: string) {
  if (leaving) return;
  const id = url.split('/').filter(Boolean).pop()!;
  const p = products.find((x) => x.id === id);
  if (!p) { location.href = url; return; }
  leaving = true;
  prefetch(url);
  sound.play('pop');
  lenis?.stop();

  // bring the cap fully on screen
  const r0 = source.getBoundingClientRect();
  if (r0.top < 0 || r0.bottom > innerHeight) {
    const target = scrollY + r0.top + r0.height / 2 - innerHeight / 2;
    await new Promise<void>((res) => {
      if (lenis) { lenis.start(); lenis.scrollTo(target, { duration: 0.7, onComplete: () => { lenis!.stop(); res(); } }); }
      else { window.scrollTo({ top: target, behavior: 'smooth' }); setTimeout(res, 600); }
    });
  }

  const r = source.getBoundingClientRect();
  const W = innerWidth, H = innerHeight;
  const ox = r.left + r.width / 2, oy = r.top + r.height / 2;

  // ---- overlay ----
  const wrap = document.createElement('div');
  wrap.className = 'tx';
  wrap.innerHTML = `<div class="tx__bg paper" style="background:${color}"></div><canvas class="tx__gl"></canvas>`;
  const flat = source.cloneNode(true) as HTMLElement;
  flat.classList.add('tx__lid');
  flat.removeAttribute('style');
  Object.assign(flat.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, opacity: '1' });
  wrap.appendChild(flat);
  document.body.appendChild(wrap);
  const bg = wrap.querySelector<HTMLElement>('.tx__bg')!;
  const canvas = wrap.querySelector<HTMLCanvasElement>('.tx__gl')!;
  gsap.set(bg, { clipPath: `circle(0px at ${ox}px ${oy}px)` });

  let stage: ReturnType<typeof makeStage>;
  try { stage = makeStage(canvas, 30); } catch { location.href = url; return; }
  const { renderer, scene, camera } = stage;
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.position.set(0, 0, 9); camera.updateProjectionMatrix();
  const wpp = (2 * Math.tan(THREE.MathUtils.degToRad(15)) * 9) / H; // world units per px at z=0

  const tilt = new THREE.Group();  // x-rotation: face-on → product view
  const spin = new THREE.Group();  // rotation about the jar's own axis (unscrew)
  tilt.add(spin); scene.add(tilt);
  const jar = buildJar(p);
  spin.add(jar.root);
  // soft shadow that appears as the jar tips upright
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 }));
  scene.add(sh);

  // final pose = where the product page will start its live jar
  const R1 = Math.min(W * 0.17, H * 0.24, 230);
  const pose = { sx: ox, sy: oy, R: r.width / 2, tilt: Math.PI / 2, spin: 0, sink: 0 };
  const end = { sx: W * (W > 1100 ? 0.46 : 0.5), sy: H * 0.5, R: R1 };

  const apply = () => {
    const s = (pose.R * wpp) / LID_R;
    tilt.scale.setScalar(s);
    tilt.position.set((pose.sx - W / 2) * wpp, -(pose.sy + pose.sink - H / 2) * wpp, 0);
    tilt.rotation.x = pose.tilt;
    spin.rotation.y = pose.spin;
    sh.position.set(tilt.position.x, tilt.position.y - 0.95 * s, -0.5);
    sh.scale.set(s, s * 0.22, 1);
    renderer.render(scene, camera);
  };
  apply();
  await new Promise(requestAnimationFrame);
  (source as HTMLElement).style.visibility = 'hidden';

  const tl = gsap.timeline({ onUpdate: apply });
  // 1 · swap flat → 3D, lift to centre, unscrew
  tl.to(flat, { opacity: 0, duration: 0.25, ease: 'none' }, 0)
    .to(pose, { sx: W / 2, sy: H * 0.46, R: r.width / 2 * 1.08, spin: -1.5, duration: 0.85, ease: 'power3.inOut' }, 0)
  // 2 · colour floods out from the cap
    .to(bg, { clipPath: `circle(${Math.hypot(W, H)}px at ${W / 2}px ${H * 0.46}px)`, duration: 1.3, ease: 'expo.inOut' }, 0.35)
  // 3 · tip from top-down to the product 3/4 view while sinking slowly
    .to(pose, { tilt: VIEW_ELEV, spin: -Math.PI * 2, R: end.R, sx: end.sx, sy: end.sy, duration: 1.35, ease: 'power2.inOut' }, 0.7)
    .to(pose, { sink: H * 0.05, duration: 0.7, ease: 'sine.out', yoyo: true, repeat: 1 }, 0.7)
    .to(sh.material, { opacity: 0.18, duration: 0.8 }, 1.2);

  await tl.then();
  apply();
  // hand the exact last frame to the next page
  const payload: TxPayload = { id, color, img: '', sx: end.sx, sy: end.sy, R: end.R, t: Date.now() };
  try { payload.img = canvas.toDataURL('image/webp', 0.92); } catch { /* ignore */ }
  try { sessionStorage.setItem(TX_KEY, JSON.stringify(payload)); }
  catch { payload.img = ''; sessionStorage.setItem(TX_KEY, JSON.stringify(payload)); }
  location.href = url;
}

/** Read (and clear) the hand-off payload on the product page. */
export function takePayload(): TxPayload | null {
  const raw = sessionStorage.getItem(TX_KEY);
  sessionStorage.removeItem(TX_KEY);
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as TxPayload;
    return Date.now() - d.t < 15000 ? d : null;
  } catch { return null; }
}

// back/forward cache: drop any leftover overlay
addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  leaving = false;
  document.querySelectorAll('.tx').forEach((n) => n.remove());
  document.querySelectorAll<HTMLElement>('[style*="visibility: hidden"]').forEach((n) => (n.style.visibility = ''));
  lenis?.start();
});
