import * as THREE from 'three';
import gsap from 'gsap';
import { buildJar, makeStage } from './jarModel';
import { products } from '../data/products';

export function initJar() {
  const canvas = document.querySelector<HTMLCanvasElement>('.jar-canvas');
  const dome = document.querySelector<HTMLElement>('.hero__dome');
  const path = document.querySelector<SVGPathElement>('.trail__path');
  const shine = document.querySelector<SVGPathElement>('.trail__shine');
  if (!canvas || !dome || !path || !shine) return null;

  let stage: ReturnType<typeof makeStage>;
  try { stage = makeStage(canvas); } catch { canvas.remove(); return null; }
  const { renderer, scene, camera } = stage;
  camera.position.set(0, 0, 20);

  const outer = new THREE.Group();   // screen position + tilt
  const spin = new THREE.Group();    // rolling spin
  outer.add(spin); scene.add(outer);
  const jar = buildJar(products[0]);
  spin.add(jar.root);
  outer.rotation.set(0.8, 0, -0.18);

  // ----- layout / trail geometry -----
  // Perf: the canvas is only as big as the jar (not the viewport) and is moved with a
  // compositor transform. That keeps the transmission pass tiny and avoids full-screen
  // WebGL compositing on every scroll frame.
  let W = 0, H = 0, S = 0, radiusPx = 120, total = 1;
  let domeTop = 0, domeLeft = 0;
  let lut = new Float32Array(0); const STEP = 4; // trail point every 4px of length
  const state = { drop: 0, drawn: -1, mx: 0, my: 0, tmx: 0, tmy: 0, visible: true, alive: true };

  const layout = () => {
    W = innerWidth; H = innerHeight;
    radiusPx = Math.max(115, Math.min(240, W * 0.15, H * 0.24));
    S = Math.ceil(radiusPx * 3.1);
    renderer.setSize(S, S, true);
    camera.aspect = 1; camera.updateProjectionMatrix();
    const wpp = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / S;
    outer.scale.setScalar(radiusPx * wpp);
    outer.position.set(0, 0, 0);

    // trail path in dome-local coordinates
    const dr = dome.getBoundingClientRect();
    domeTop = dr.top + scrollY; domeLeft = dr.left + scrollX;
    const y0 = H * 0.93 - domeTop;
    const L = dome.offsetHeight * 0.78 - y0;
    const cx0 = dr.width * 0.5, cx1 = dr.width * (W < 900 ? 0.5 : 0.42), A = Math.min(90, W * 0.06);
    const pts: { x: number; y: number }[] = [];
    for (let y = 0; y <= L; y += 16) {
      const t = y / L;
      pts.push({ x: cx0 + (cx1 - cx0) * (1 - Math.pow(1 - t, 2)) + A * Math.sin(t * Math.PI * 3) * Math.min(1, t * 4), y: y0 + y });
    }
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    path.setAttribute('d', d); shine.setAttribute('d', d);
    path.setAttribute('stroke-width', String(radiusPx * 1.05));
    shine.setAttribute('stroke-width', String(radiusPx * 0.18));
    shine.setAttribute('transform', `translate(${-radiusPx * 0.22} 0)`);
    total = path.getTotalLength();
    for (const el of [path, shine]) { el.style.strokeDasharray = `${total} ${total}`; }

    // pre-sample the path once so the per-frame lookup is O(1) and never touches the SVG DOM
    const n = Math.ceil(total / STEP) + 1;
    lut = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { const p = path.getPointAtLength(Math.min(total, i * STEP)); lut[i * 2] = p.x; lut[i * 2 + 1] = p.y; }
    state.drawn = -1; // force a trail redraw
  };

  const pointAt = (len: number) => {
    const f = Math.max(0, Math.min(total, len)) / STEP;
    const i = Math.min(Math.floor(f), lut.length / 2 - 2), k = f - i;
    return { x: lut[i * 2] + (lut[i * 2 + 2] - lut[i * 2]) * k, y: lut[i * 2 + 1] + (lut[i * 2 + 3] - lut[i * 2 + 1]) * k };
  };

  let shown = true;
  const show = (v: boolean) => { if (v !== shown) { shown = v; canvas.style.visibility = v ? '' : 'hidden'; } };

  const frame = () => {
    if (!state.alive || !lut.length) return;
    const sY = scrollY;
    const drawn = Math.min(total, Math.max(0, sY));
    if (drawn !== state.drawn) {
      state.drawn = drawn;
      const off = String(total - drawn);
      path.style.strokeDashoffset = off; shine.style.strokeDashoffset = off;
    }
    const p = pointAt(drawn);
    const sx = domeLeft - scrollX + p.x, sy = domeTop - sY + p.y - (1 - state.drop) * (H * 0.9);
    state.visible = sy > -S && sy < H + S;
    show(state.visible);
    if (!state.visible) return;
    canvas.style.transform = `translate3d(${(sx - S / 2).toFixed(1)}px,${(sy - S / 2).toFixed(1)}px,0)`;
    state.mx += (state.tmx - state.mx) * 0.06; state.my += (state.tmy - state.my) * 0.06;
    spin.rotation.y = -drawn / radiusPx + performance.now() * 0.00015;
    outer.rotation.x = 0.8 + state.my * 0.25 - (1 - state.drop) * 0.8;
    outer.rotation.z = -0.18 + state.mx * 0.25;
    renderer.render(scene, camera);
  };

  addEventListener('pointermove', (e) => { state.tmx = (e.clientX / innerWidth - 0.5) * 2; state.tmy = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  let rt = 0;
  const relayout = () => { clearTimeout(rt); rt = window.setTimeout(layout, 120); };
  addEventListener('resize', relayout);
  new ResizeObserver(relayout).observe(dome);
  document.fonts.ready.then(() => {
    jar.refresh();
    layout();
  });
  layout();
  gsap.ticker.add(frame);

  return {
    drop() { gsap.to(state, { drop: 1, duration: 1.6, ease: 'bounce.out' }); },
    relayout: layout,
  };
}
