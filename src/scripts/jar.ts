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
  let W = 0, H = 0, wpp = 0, radiusPx = 120, total = 1, pts: { x: number; y: number }[] = [];
  const state = { drop: 0, drawn: 0, mx: 0, my: 0, tmx: 0, tmy: 0, visible: true, alive: true };

  const layout = () => {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    wpp = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / H;
    radiusPx = Math.max(115, Math.min(240, W * 0.15, H * 0.24));
    outer.scale.setScalar(radiusPx * wpp);

    // trail path in dome-local coordinates
    const dr = dome.getBoundingClientRect();
    const domeTop = dr.top + scrollY;
    const y0 = H * 0.93 - domeTop;
    const L = dome.offsetHeight * 0.78 - y0;
    const cx0 = dr.width * 0.5, cx1 = dr.width * (W < 900 ? 0.5 : 0.42), A = Math.min(90, W * 0.06);
    pts = [];
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
  };

  const pointAt = (len: number) => path.getPointAtLength(Math.max(0, Math.min(total, len)));

  const update = () => {
    state.drawn = Math.min(total, Math.max(0, scrollY));
    const off = String(total - state.drawn);
    path.style.strokeDashoffset = off; shine.style.strokeDashoffset = off;
  };

  const frame = () => {
    if (!state.alive) return;
    update();
    const dr = dome.getBoundingClientRect();
    const p = pointAt(state.drawn);
    const sx = dr.left + p.x, sy = dr.top + p.y - (1 - state.drop) * (H * 0.9);
    state.visible = sy > -radiusPx * 3 && sy < H + radiusPx * 3;
    if (!state.visible) { renderer.clear(); return; }
    state.mx += (state.tmx - state.mx) * 0.06; state.my += (state.tmy - state.my) * 0.06;
    outer.position.set((sx - W / 2) * wpp, -(sy - H / 2) * wpp, 0);
    spin.rotation.y = -state.drawn / radiusPx + performance.now() * 0.00015;
    outer.rotation.x = 0.8 + state.my * 0.25 - (1 - state.drop) * 0.8;
    outer.rotation.z = -0.18 + state.mx * 0.25;
    renderer.render(scene, camera);
  };

  addEventListener('pointermove', (e) => { state.tmx = (e.clientX / innerWidth - 0.5) * 2; state.tmy = (e.clientY / innerHeight - 0.5) * 2; });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(layout, 120); });
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
