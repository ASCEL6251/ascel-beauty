import Matter from 'matter-js';
import { sound } from './sound';

// Jar lids tumble into the footer and can be dragged / flicked around.
export function initFooterPhysics(root: HTMLElement) {
  const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Body } = Matter;
  const els = [...root.querySelectorAll<HTMLElement>('.body')];
  const W = () => root.clientWidth;
  const H = () => root.clientHeight;
  const size = Math.max(110, Math.min(230, W() * 0.15));

  const engine = Engine.create({ gravity: { y: 1.1 } });
  const wallOpts = { isStatic: true, restitution: 0.4 };
  let walls: Matter.Body[] = [];
  const buildWalls = () => {
    Composite.remove(engine.world, walls);
    const w = W(), h = H(), t = 200;
    walls = [
      Bodies.rectangle(w / 2, h + t / 2 - 56, w * 3, t, wallOpts),
      Bodies.rectangle(-t / 2, h / 2, t, h * 4, wallOpts),
      Bodies.rectangle(w + t / 2, h / 2, t, h * 4, wallOpts),
    ];
    Composite.add(engine.world, walls);
  };
  buildWalls();

  const bodies = els.map((el, i) => {
    el.style.width = el.style.height = `${size}px`;
    const b = Bodies.circle(W() * (0.2 + 0.12 * i) + (Math.random() - 0.5) * 40, -size * (1 + i * 0.9), size / 2, {
      restitution: 0.55, friction: 0.08, frictionAir: 0.012, density: 0.002,
    });
    Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.2);
    return b;
  });
  Composite.add(engine.world, bodies);

  if (matchMedia('(pointer: fine)').matches) {
    const mouse = Mouse.create(root);
    // let the page scroll normally over the footer
    const m = mouse as any;
    root.removeEventListener('wheel', m.mousewheel);
    root.removeEventListener('mousewheel', m.mousewheel);
    root.removeEventListener('DOMMouseScroll', m.mousewheel);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    Composite.add(engine.world, mc);
    Events.on(mc, 'startdrag', () => sound.play('pop'));
  }

  Events.on(engine, 'collisionStart', (e) => {
    for (const p of e.pairs) {
      const v = Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y);
      if (v > 6) { sound.play('thud'); break; }
    }
  });

  const runner = Runner.create();
  Runner.run(runner, engine);
  Events.on(engine, 'afterUpdate', () => {
    bodies.forEach((b, i) => {
      els[i].style.transform = `translate(${b.position.x - size / 2}px, ${b.position.y - size / 2}px) rotate(${b.angle}rad)`;
    });
  });

  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(buildWalls, 150); });
}
