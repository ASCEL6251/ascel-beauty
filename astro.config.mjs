// © 2026 AscelStack (ascelstack.com). All rights reserved. Proprietary — see LICENSE.
import { defineConfig } from 'astro/config';

const banner = '/*! Ascel Beauty © 2026 AscelStack — https://ascelstack.com — All rights reserved. Unauthorized copying, redistribution or reuse of this code is prohibited. See LICENSE. */';

export default defineConfig({
  site: 'https://ascelstack.com',
  devToolbar: { enabled: false },
  vite: {
    plugins: [{
      // stamp the copyright notice on every emitted JS chunk
      name: 'ascel-copyright-banner',
      apply: 'build',
      generateBundle(_, bundle) {
        for (const f of Object.values(bundle)) if (f.type === 'chunk') f.code = `${banner}\n${f.code}`;
      },
    }],
  },
});
