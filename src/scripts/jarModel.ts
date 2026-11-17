import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type JarProduct = {
  lid: string; rim: string; ink: string; cream: string;
  name: string; name2: string; variant: string;
};

const DOLLOP = 'M110 6c14 0 22 9 20 20 18-6 36 4 36 20 22-2 44 12 44 36 0 22-16 34-34 36 4 22-14 34-36 30-10 12-48 12-60 0-22 4-40-8-36-30C26 116 10 104 10 82c0-24 22-38 44-36 0-16 18-26 36-20-2-11 6-20 20-20z';

function fitFont(g: CanvasRenderingContext2D, text: string, weight: number, size: number, maxW: number) {
  let s = size;
  do { g.font = `${weight} ${s}px "Barlow Condensed", sans-serif`; s -= 4; } while (g.measureText(text).width > maxW && s > 20);
}

function lidTexture(P: JarProduct) {
  const s = 1024, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const cx = s / 2;
  g.fillStyle = P.rim; g.fillRect(0, 0, s, s);
  g.fillStyle = P.lid; g.beginPath(); g.arc(cx, cx, s * 0.44, 0, Math.PI * 2); g.fill();
  g.fillStyle = P.ink; g.font = `800 ${s * 0.036}px "Inter Tight", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const chars = [...'MADE WITH LOVE • 50 ML • ASCEL BEAUTY • DERM TESTED • VEGAN • '.repeat(2)];
  const step = (Math.PI * 2) / chars.length;
  chars.forEach((ch, i) => { g.save(); g.translate(cx, cx); g.rotate(i * step); g.translate(0, -s * 0.375); g.fillText(ch, 0, 0); g.restore(); });
  g.globalAlpha = 0.3; g.strokeStyle = P.ink; g.setLineDash([4, 12]); g.lineWidth = 4;
  g.beginPath(); g.arc(cx, cx, s * 0.32, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  g.save(); g.translate(cx - 80, s * 0.2); g.scale(0.72, 0.72);
  g.fillStyle = P.ink; g.fill(new Path2D(DOLLOP));
  g.fillStyle = P.lid; g.font = '900 44px "Barlow Condensed", sans-serif'; g.fillText('ASCEL', 110, 64);
  g.font = '900 32px "Barlow Condensed", sans-serif'; g.fillText('BEAUTY', 110, 102);
  g.restore();
  g.fillStyle = P.ink;
  fitFont(g, P.name, 900, s * 0.15, s * 0.6); g.fillText(P.name, cx, s * 0.47);
  fitFont(g, P.name2, 900, s * 0.12, s * 0.56); g.fillText(P.name2, cx, s * 0.59);
  g.beginPath(); g.moveTo(cx - 200, s * 0.7); g.lineTo(cx + 200, s * 0.7); g.lineTo(cx + 175, s * 0.74); g.lineTo(cx + 200, s * 0.78); g.lineTo(cx - 200, s * 0.78); g.lineTo(cx - 175, s * 0.74); g.closePath(); g.fill();
  g.fillStyle = P.lid; g.font = `800 ${s * 0.05}px "Barlow Condensed", sans-serif`; g.fillText(P.variant, cx, s * 0.742);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  // cylinder cap UVs are quarter-turned; rotate so the label reads upright from the front
  t.center.set(0.5, 0.5); t.rotation = Math.PI / 2;
  return t;
}

function bandTexture(P: JarProduct) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = P.lid; g.fillRect(0, 0, 2048, 256);
  g.fillStyle = P.ink; g.fillRect(0, 0, 2048, 14); g.fillRect(0, 242, 2048, 14);
  g.font = '900 120px "Barlow Condensed", sans-serif'; g.textBaseline = 'middle';
  const txt = `ASCEL BEAUTY ✿ ${P.name} ✿ `;
  for (let x = 20; x < 2048; x += g.measureText(txt).width) g.fillText(txt, x, 134);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
}

function creamTexture(P: JarProduct) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = P.cream; g.fillRect(0, 0, 1024, 512);
  // diagonal streaks in UV space read as a spiral swirl on the lathe surface
  for (let i = -20; i < 40; i++) {
    const x = i * 48;
    g.strokeStyle = i % 3 === 0 ? P.lid : '#ffffff';
    g.globalAlpha = i % 3 === 0 ? 0.35 : 0.55;
    g.lineWidth = i % 3 === 0 ? 10 : 16;
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 120, 170, x + 200, 340, x + 330, 512); g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1);
  return t;
}

const V = (pts: number[][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

/** Swirled cream: lathe body + whipped peak, displaced into a spiral. */
function creamGeometry() {
  const pts: number[][] = [[0, -0.64], [0.86, -0.64], [0.91, -0.58], [0.91, 0.28]];
  for (let i = 0; i <= 40; i++) {
    const r = 0.91 * (1 - i / 40);
    pts.push([r, 0.3 + 0.24 * Math.exp(-Math.pow(r / 0.3, 2)) + 0.04 * (1 - r)]);
  }
  const geo = new THREE.LatheGeometry(V(pts), 220);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0.29) continue;
    const r = Math.hypot(x, z), th = Math.atan2(z, x);
    const swirl = Math.sin(th * 2 + r * 16) * 0.055 * Math.sin(Math.min(1, r / 0.91) * Math.PI);
    p.setY(i, y + swirl);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildJar(P: JarProduct) {
  const root = new THREE.Group();

  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(V([[0, -0.72], [0.82, -0.72], [0.94, -0.69], [1.0, -0.6], [1.0, 0.28], [0.98, 0.36], [0.9, 0.4], [0.9, 0.54], [0.86, 0.54], [0.86, -0.66], [0, -0.66]]), 128),
    new THREE.MeshPhysicalMaterial({
      color: '#ffe6ef', transmission: 0.65, thickness: 0.6, roughness: 0.28, ior: 1.45,
      attenuationColor: new THREE.Color(P.lid), attenuationDistance: 2.2, clearcoat: 1, clearcoatRoughness: 0.08,
    }),
  );
  root.add(glass);

  const creamMat = new THREE.MeshPhysicalMaterial({
    map: creamTexture(P), roughness: 0.38, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.35,
  });
  const cream = new THREE.Mesh(creamGeometry(), creamMat);
  root.add(cream);

  const bandMat = new THREE.MeshPhysicalMaterial({ map: bandTexture(P), roughness: 0.4, clearcoat: 0.7 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.006, 1.006, 0.58, 128, 1, true), bandMat);
  band.position.y = -0.18; root.add(band);

  // lid
  const lid = new THREE.Group(); lid.position.y = 0.74; root.add(lid);
  const rimMat = new THREE.MeshPhysicalMaterial({ color: P.rim, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide });
  const ridgeGeo = new THREE.CylinderGeometry(1.06, 1.06, 0.36, 360, 6, true);
  const pos = ridgeGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    const ang = Math.atan2(z, x);
    const edge = 1 - Math.pow(Math.abs(y) / 0.18, 6) * 0.5;
    const r = 1.06 + 0.018 * Math.pow(Math.abs(Math.cos(ang * 90)), 0.6) * edge;
    pos.setXYZ(i, Math.cos(ang) * r, y, Math.sin(ang) * r);
  }
  ridgeGeo.computeVertexNormals();
  lid.add(new THREE.Mesh(ridgeGeo, rimMat));
  const topEdge = new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.05, 20, 160), rimMat);
  topEdge.rotation.x = Math.PI / 2; topEdge.position.y = 0.18; lid.add(topEdge);
  const botEdge = topEdge.clone(); botEdge.position.y = -0.18; lid.add(botEdge);
  const lidTop = new THREE.MeshPhysicalMaterial({ map: lidTexture(P), roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.15 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.04, 0.08, 160), [rimMat, lidTop, rimMat]);
  cap.position.y = 0.2; lid.add(cap);
  // underside of the lid (seen when opened)
  const under = new THREE.Mesh(new THREE.CircleGeometry(1.02, 96), new THREE.MeshPhysicalMaterial({ color: P.rim, roughness: 0.5 }));
  under.rotation.x = Math.PI / 2; under.position.y = -0.17; lid.add(under);

  const refresh = () => {
    lidTop.map?.dispose(); bandMat.map?.dispose();
    lidTop.map = lidTexture(P); bandMat.map = bandTexture(P);
    lidTop.needsUpdate = true; bandMat.needsUpdate = true;
  };

  return { root, lid, cream, refresh };
}

export function makeStage(canvas: HTMLCanvasElement, fov = 30) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-5, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb3cf, 1.4); rim.position.set(6, -2, -4); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  return { renderer, scene, camera };
}
