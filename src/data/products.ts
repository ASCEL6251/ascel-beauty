export type Product = {
  id: string;
  nick: string; // big headline word pair: "THE" + nick
  name: string; // label line 1
  name2: string; // label line 2
  variant: string; // ribbon text
  bg: string; // section background
  lid: string; // lid main color
  rim: string; // lid rim color
  ink: string; // text on lid
  accent: string;
  tags: string[];
  blurb: string;
  scenes: [string, string];
  cream: string; // colour of the cream inside the jar
  texture: string;
  price: number; // 50ml price, USD (demo)
  rating: number;
  reviews: number;
  ingredients: { name: string; note: string }[];
  steps: string[];
};

export const sizes = [
  { ml: 30, mult: 0.7 },
  { ml: 50, mult: 1 },
  { ml: 100, mult: 1.7 },
];
export const priceFor = (p: Product, ml: number) => {
  const s = sizes.find((x) => x.ml === ml) ?? sizes[1];
  return Math.round(p.price * s.mult) - 0.01;
};

export const products: Product[] = [
  {
    id: 'cloud-whip',
    nick: 'SOFTIE',
    name: 'CLOUD WHIP',
    name2: 'MOISTURIZER',
    variant: 'EVERYDAY',
    bg: '#FF7A3D',
    lid: '#FFB3CF',
    rim: '#FFD84D',
    ink: '#5A0F2E',
    accent: '#FFD84D',
    tags: ['HYDRATE', 'PLUMP', 'PREP'],
    blurb: 'Always ready for dry mornings, mask-day recovery and quick glow-ups. Easygoing. Sinks in clean. No drama.',
    scenes: ['swatch', 'mirror'],
    cream: '#FFE1EC',
    texture: 'Whipped, airy, melts in like a cloud.',
    price: 28,
    rating: 4.8,
    reviews: 1284,
    ingredients: [{ name: 'Hyaluronic Acid', note: 'pulls water into skin' }, { name: 'Squalane', note: 'light, weightless softness' }, { name: 'Rose Water', note: 'calms and freshens' }],
    steps: ['Smooth a pea-size scoop over clean skin.', 'Press in with warm palms, no rubbing.', 'Follow with SPF in the morning.'],
  },
  {
    id: 'glow-dew',
    nick: 'SUNNY ONE',
    name: 'GLOW DEW',
    name2: 'DAY CREAM',
    variant: 'SPF 30',
    bg: '#2F7DF6',
    lid: '#FFD84D',
    rim: '#FF7A3D',
    ink: '#5A0F2E',
    accent: '#FFD84D',
    tags: ['PROTECT', 'BRIGHTEN', 'PRIME'],
    blurb: 'Sunscreen that behaves like skincare. Dewy, never greasy, and happy under makeup from school run to sunset.',
    scenes: ['sun', 'bag'],
    cream: '#FFF1B8',
    texture: 'Dewy gel-cream with a sunny glow.',
    price: 34,
    rating: 4.7,
    reviews: 962,
    ingredients: [{ name: 'SPF 30 Filters', note: 'broad-spectrum daily cover' }, { name: 'Vitamin C', note: 'brightens dull days' }, { name: 'Niacinamide', note: 'evens and refines' }],
    steps: ['Apply as the last step of your morning.', 'Use two finger-lengths for face and neck.', 'Top up every two hours outdoors.'],
  },
  {
    id: 'night-velvet',
    nick: 'DREAMER',
    name: 'NIGHT VELVET',
    name2: 'REPAIR',
    variant: 'OVERNIGHT',
    bg: '#7B5CFF',
    lid: '#C9B8FF',
    rim: '#5A0F2E',
    ink: '#2A1460',
    accent: '#FFB3CF',
    tags: ['REPAIR', 'RENEW', 'REST'],
    blurb: 'A rich, slow-melt cream that works the night shift. Wake up softer after late deadlines and later scrolling.',
    scenes: ['moon', 'pillow'],
    cream: '#E3D8FF',
    texture: 'Rich, velvety balm-cream for the night shift.',
    price: 42,
    rating: 4.9,
    reviews: 2107,
    ingredients: [{ name: 'Bakuchiol', note: 'gentle retinol alternative' }, { name: 'Ceramides', note: 'rebuilds the barrier overnight' }, { name: 'Lavender Oil', note: 'winds you down' }],
    steps: ['Warm a scoop between fingertips.', 'Press over face after serums.', 'Sleep. Wake up softer.'],
  },
  {
    id: 'barrier-butter',
    nick: 'PROTECTOR',
    name: 'BARRIER',
    name2: 'BUTTER BALM',
    variant: 'INTENSE',
    bg: '#1F9D63',
    lid: '#C8F169',
    rim: '#FFF4E6',
    ink: '#0F3D22',
    accent: '#FFF4E6',
    tags: ['SOOTHE', 'SEAL', 'RESCUE'],
    blurb: 'For wind-burn, flaky patches and the cold-weather chaos. One tough, gentle layer that holds the moisture in.',
    scenes: ['snow', 'hands'],
    cream: '#E4F7C4',
    texture: 'Thick, cushiony butter that seals in moisture.',
    price: 36,
    rating: 4.8,
    reviews: 731,
    ingredients: [{ name: 'Shea Butter', note: 'deep, lasting nourishment' }, { name: 'Oat Extract', note: 'soothes itch and redness' }, { name: 'Panthenol', note: 'helps skin repair' }],
    steps: ['Use on damp skin for extra seal.', 'Layer thicker on dry patches.', 'Reapply whenever skin feels tight.'],
  },
  {
    id: 'eye-hug',
    nick: 'GENTLE',
    name: 'EYE HUG',
    name2: 'CREAM',
    variant: 'COOLING',
    bg: '#FF5C8A',
    lid: '#9FE3FF',
    rim: '#FFF4E6',
    ink: '#103A5C',
    accent: '#9FE3FF',
    tags: ['DEPUFF', 'COOL', 'CALM'],
    blurb: 'A cooling little hug for tired eyes. Tap it in after short sleep, long flights and big cries.',
    scenes: ['eye', 'coffee'],
    cream: '#DDF3FF',
    texture: 'Cool, bouncy gel-cream for tired eyes.',
    price: 30,
    rating: 4.6,
    reviews: 588,
    ingredients: [{ name: 'Caffeine', note: 'depuffs morning eyes' }, { name: 'Peptides', note: 'firms and smooths' }, { name: 'Cucumber', note: 'instant cooling' }],
    steps: ['Dot a rice-grain amount under each eye.', 'Tap in with your ring finger.', 'Keep it in the fridge for extra chill.'],
  },
  {
    id: 'hand-rescue',
    nick: 'HELPER',
    name: 'HAND RESCUE',
    name2: 'CREAM',
    variant: 'NON-GREASY',
    bg: '#E2453C',
    lid: '#FF9A7A',
    rim: '#FFD84D',
    ink: '#5A0F2E',
    accent: '#FFD84D',
    tags: ['NOURISH', 'MEND', 'CARRY'],
    blurb: 'Lives in your bag, your desk and your car door. Fast-absorbing, so you can get right back to it.',
    scenes: ['hands', 'bag'],
    cream: '#FFE0D4',
    texture: 'Silky, fast-absorbing, never greasy.',
    price: 18,
    rating: 4.8,
    reviews: 1653,
    ingredients: [{ name: 'Glycerin', note: 'quick, lasting hydration' }, { name: 'Almond Oil', note: 'softens cuticles' }, { name: 'Vitamin E', note: 'protects busy hands' }],
    steps: ['Massage into backs of hands.', 'Work into cuticles and knuckles.', 'Reapply after every wash.'],
  },
];
