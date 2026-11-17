<p align="center">
  <img src="docs/banner.svg" alt="Ascel Beauty — Glow With You. A concept cream brand by AscelStack." width="100%">
</p>

<p align="center">
  <a href="https://ascelstack.com"><img alt="Built by AscelStack" src="https://img.shields.io/badge/built%20by-AscelStack-1f2023?style=for-the-badge&labelColor=ffb81c"></a>
  <img alt="Astro" src="https://img.shields.io/badge/Astro-7-ff5d01?style=for-the-badge&logo=astro&logoColor=white">
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-r187-000000?style=for-the-badge&logo=threedotjs&logoColor=white">
  <img alt="GSAP" src="https://img.shields.io/badge/GSAP-3.15-0ae448?style=for-the-badge&logo=greensock&logoColor=black">
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-f38020?style=for-the-badge&logo=cloudflare&logoColor=white">
  <a href="./LICENSE"><img alt="License: Proprietary" src="https://img.shields.io/badge/license-proprietary%20%C2%B7%20all%20rights%20reserved-c8102e?style=for-the-badge"></a>
</p>

<p align="center">
  <b>Ascel Beauty</b> is a concept skincare brand. It is a playful, tactile, scroll-driven storefront where every cream jar is a real-time 3D object you can spin, open and look inside.<br>
  Designed and engineered by <a href="https://ascelstack.com"><b>AscelStack</b></a> as a product demo.
</p>

> [!IMPORTANT]
> **This is proprietary software.** The source is public **for showcase only**. Copying, re-hosting, re-skinning or reusing any part of it is prohibited. See [LICENSE](./LICENSE) and [SECURITY.md](./SECURITY.md). © 2026 AscelStack. All rights reserved.

---

## ✿ The experience

<table>
  <tr>
    <td width="50%"><img src="docs/media/hero.jpg" alt="Hero: GLOW WITH YOU headline with a 3D jar rolling along a cream trail"></td>
    <td width="50%"><img src="docs/media/family.jpg" alt="Product family slider with lid selector rail"></td>
  </tr>
  <tr>
    <td align="center"><b>Hero</b><br><sub>A 3D jar rolls down a wavy cream trail as you scroll.</sub></td>
    <td align="center"><b>The Family</b><br><sub>Six creams, six colour worlds. Pick a lid to switch the whole page.</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/media/product.jpg" alt="Product page: open 3D jar, price card with size and quantity"></td>
    <td width="50%"><img src="docs/media/inside.jpg" alt="What's inside: ingredient list and cream swirl"></td>
  </tr>
  <tr>
    <td align="center"><b>Product page</b><br><sub>Drag to rotate 360°, tap to open the lid, then choose a size and add to the bag.</sub></td>
    <td align="center"><b>What's inside</b><br><sub>Ingredient story, how-to steps and related creams.</sub></td>
  </tr>
</table>

## ✿ The signature move: a lid that becomes a jar

Click any lid in the slider. Instead of a page load, the flat lid **turns into a real 3D jar**. The jar unscrews, tips over and sinks while the product colour floods the screen, then lands on the product page and opens to show the cream inside.

<p align="center">
  <img src="docs/media/transition.gif" alt="Recording of the 3D product-open transition" width="100%">
  <br><sub>Real capture from the site (Chrome, 1440×900). <a href="docs/media/transition.mp4">MP4 version</a></sub>
</p>

<p align="center">
  <img src="docs/flow.svg" alt="Five-step flow of the product-open transition" width="100%">
</p>

### How it works

```mermaid
sequenceDiagram
    autonumber
    actor U as Visitor
    participant H as Home page
    participant GL as WebGL overlay (Three.js)
    participant SS as sessionStorage
    participant P as Product page

    U->>H: clicks a lid
    H->>H: prefetch /products/:id · scroll the cap into view
    H->>GL: mount the full-screen canvas · build the 3D jar at the lid's exact position
    GL->>GL: GSAP timeline: unscrew → colour flood → tilt to 3/4 view → sink
    GL->>SS: last frame (WebP) + final screen pose
    H->>P: navigate (cross-document View Transition)
    P->>P: inline script paints the snapshot before first paint
    P->>P: live jar is placed at the same pose (unproject)
    P-->>U: snapshot fades, jar glides in, lid opens, drag to rotate
```

| Piece | What it does |
| ----- | ------------ |
| **Procedural 3D jar** | Built in code with `LatheGeometry`: transmissive glass, whipped cream with a spiral displacement, a ridged lid, and canvas-drawn labels for each product. No model files to download. |
| **Pose-matched hand-off** | The overlay renders at the exact screen position, size and orientation the product page will start from. The product page re-projects the same pose, so the swap is pixel-aligned. |
| **Zero-flash navigation** | Prefetch, an inline snapshot paint and `@view-transition` together hide the browser's page swap. |
| **Scroll choreography** | GSAP ScrollTrigger handles pinning, horizontal scroll and scrubbed reveals. Lenis gives inertial scrolling. |
| **Tactile details** | Matter.js lid pile in the footer, a custom cursor, a pull-tag menu, and UI sounds synthesised with WebAudio (off by default). |
| **Respectful motion** | Honours `prefers-reduced-motion`. Every page is static HTML first. |

## ✿ Architecture

```mermaid
flowchart LR
    subgraph Build["Build: Astro (static)"]
      D[src/data/products.ts] --> PG[src/pages/*.astro]
      C[src/components/*] --> PG
      S[src/scripts/*.ts] --> PG
      PG --> DIST[(dist/)]
    end
    subgraph Edge["Cloudflare Workers · static assets"]
      DIST --> A[Global edge cache]
      HDR[public/_headers] --> A
    end
    A --> B[Visitor's browser]
    B --> GL[Three.js · GSAP · Lenis · Matter.js]
```

```
src/
├─ data/products.ts        six creams: colours, copy, pricing, ingredients
├─ layouts/Base.astro      <head>, fonts, AscelStack badge
├─ components/             Chrome (topbar, menu, cursor), Footer, Lid, Logo, Split…
├─ pages/
│  ├─ index.astro          home: hero, family slider, moments, CTA
│  ├─ products/[id].astro  6 statically generated product pages
│  └─ 404.astro
├─ scripts/
│  ├─ jarModel.ts          procedural 3D jar + stage
│  ├─ jar.ts               hero jar rolling on the cream trail
│  ├─ transition.ts        3D lid → jar page transition
│  ├─ product.ts           product viewer, buy box, reveals
│  ├─ main.ts · ui.ts      home choreography, Lenis, cursor, menu
│  └─ physics.ts · sound.ts
└─ styles/global.css
```

## ✿ Deploying (AscelStack team only)

The site deploys to **Cloudflare Workers** as static assets. The config is in [`wrangler.jsonc`](./wrangler.jsonc).

**Option A: GitHub connection (recommended)**

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a repository** and pick `ASCEL6251/ascel-beauty`.
2. Use these settings:

   | Setting | Value |
   | ------- | ----- |
   | Project / Worker name | `ascel-beauty` |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/` |

3. Save and deploy. Every push to `main` then redeploys automatically, and pull requests get preview URLs.

**Option B: CLI**

```bash
npm ci
npx wrangler login
npm run deploy
```

Local evaluation: `npm run dev` (Astro dev server), or `npm run cf:dev` (production build served by Wrangler).

## ✿ License & ownership

**© 2026 AscelStack ([ascelstack.com](https://ascelstack.com)). All rights reserved.**

- Licensed under the **[AscelStack Proprietary License](./LICENSE)**. This is **not** open source.
- You may **view** this code on GitHub. You may **not** copy it, clone it into another project, re-host it, re-brand it, sell it, or use it to train AI.
- Ownership markers are embedded in the build, the HTML, the HTTP headers and the visible badge. Infringement is pursued through DMCA takedowns and legal action ([SECURITY.md](./SECURITY.md#5-enforcement)).
- Third-party libraries keep their own licences ([NOTICE](./NOTICE)).

<p align="center">
  <a href="https://ascelstack.com"><img src="https://img.shields.io/badge/A-AscelStack-1f2023?style=for-the-badge&labelColor=ffffff&color=1f2023" alt="AscelStack"></a>
  <br><sub>Want a site like this for your brand? <a href="https://ascelstack.com">Talk to AscelStack →</a></sub>
</p>
