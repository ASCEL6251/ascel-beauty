# Security & IP Protection Policy

**Ascel Beauty** is proprietary software owned by **[AscelStack](https://ascelstack.com)**.
This policy covers two things: how to report a security problem, and how we protect and enforce our code ownership.

---

## 1. Supported versions

| Version | Supported |
| ------- | --------- |
| `main` (live site) | ✅ |
| Any fork, mirror or copy | ❌ unauthorised, not supported |

## 2. Reporting a vulnerability

Please **do not open a public issue** for security problems.

1. Use GitHub **Private vulnerability reporting**: *Security → Report a vulnerability* on this repository, **or**
2. Contact us through **[ascelstack.com](https://ascelstack.com)**.

Include the affected URL or file, steps to reproduce, and the impact you expect.

| Step | Target time |
| ---- | ----------- |
| We acknowledge your report | 3 business days |
| First assessment | 7 business days |
| Fix for a confirmed high-severity issue | 30 days |

Please give us reasonable time to fix the issue before you disclose it. Good-faith research that respects this policy will not lead to legal action from us.

**Out of scope:** copying or re-hosting the site, denial-of-service testing, social engineering, and findings in third-party services (Cloudflare, GitHub, Google Fonts).

## 3. Reporting stolen code

Have you found this code, design, 3D jar, animations or brand assets on another site, repository, template market or AI dataset? Then report it through **[ascelstack.com](https://ascelstack.com)** and include:

- the URL(s) of the copy
- screenshots or archived links (for example web.archive.org)
- any matching markers you found (see §4)

## 4. How we protect the work

| Layer | Protection |
| ----- | ---------- |
| **Licence** | [`LICENSE`](./LICENSE): AscelStack Proprietary License, all rights reserved. Viewing on GitHub is the only permitted use. |
| **Code markers** | Every built JS chunk starts with a `/*! … © AscelStack … */` banner. Every HTML page has a copyright comment plus `author` / `copyright` meta tags. |
| **Response headers** | `X-Copyright` on every response. `X-Frame-Options: DENY` and `frame-ancestors 'none'` stop the site being framed or wrapped by other domains. |
| **Visible attribution** | A fixed **AscelStack DEMO** badge with a link back to ascelstack.com is on every page. Removing it is a licence breach. |
| **Hardening** | HSTS, `nosniff`, a strict referrer policy, a locked-down `Permissions-Policy` and COOP, set in [`public/_headers`](./public/_headers). |
| **Repository** | Changes reach `main` only from authorised contributors. Deployment runs only through AscelStack's Cloudflare account. |

## 5. Enforcement

Any use outside the licence is copyright infringement. AscelStack will:

1. File **DMCA takedown notices** (17 U.S.C. § 512) with GitHub, hosts, CDNs, registrars and search engines.
2. Report the infringing deployment to its hosting provider for removal.
3. Pursue **legal action** for injunctions, damages and costs where appropriate.

> Publishing the source publicly is a showcase, **not** a licence. All rights reserved © 2026 AscelStack.
