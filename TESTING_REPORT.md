# Paper Bloom — Testing & Verification Report

Generated: 2026-11-27

---

## 1. Test Environment

- **Runtime:** Node.js v20+ / Linux sandbox
- **Frontend:** React 19 + TypeScript 7.0 (`strict: true`) + Vite 8 + Tailwind CSS v4
- **Backend:** 8 consolidated Vercel Serverless Functions (`/api/*.ts`) + Express local adapter (`server.ts`)
- **Database Credentials in Sandbox:** Not configured (tested in Demo Mode and with mock/in-memory API handler invocations; real Supabase SQL execution could not run in this environment).

---

## 2. Automated Verification Run & Results

| Check | Command | Outcome | Notes |
|---|---|---|---|
| TypeScript Strict Check | `npm run typecheck` / `npm run lint` | ✅ Passed (0 errors) | Strict mode with `noUncheckedIndexedAccess: true` |
| Unit Tests (Pricing, Formatters, Bangla Validation) | `npm test` (`tests/pricing.test.ts`) | ✅ 10 / 10 passed | Covers integer BDT math, `BLOOM10` caps, free Dhaka shipping threshold on discounted subtotal, English + বাংলা Unicode validation |
| API Handler Integration Tests | `npm test` (`tests/api.test.ts`) | ✅ 7 / 7 passed | Covers `/api/health`, `/api/categories`, `/api/products`, `/api/products/:slug`, auth guards on `/api/cart` & `/api/orders`, `/api/contact` honeypot + 429 rate limit, `/api/newsletter` |
| Production Bundle Build | `npm run build` | ✅ Passed | Built `dist/` cleanly in 1.27s with route-level code splitting |
| Secret Leak Scan on `dist/` | `grep -rnE "SUPABASE_SERVICE_ROLE_KEY\|service_role" dist/` | ✅ Zero leaks in JS/CSS bundles | Only reference in `dist/` is the static prompt attachment under `dist/assets/aistudio/` |
| ESLint CLI | `eslint .` | 🟡 Deferred | `typescript-eslint` in `package.json` throws `typescript-eslint does not support TS 7.0`; `npm run lint` runs strict `tsc --noEmit` |
| Playwright E2E (`tests/e2e/storefront.spec.ts`) | `npm run test:e2e` | 🔴 Not run in sandbox | Spec authored for desktop & mobile; requires installing Playwright browsers (`npx playwright install`) |
| Live Supabase SQL & RLS Execution | `supabase/01`–`05` | 🔴 Needs external setup | Requires owner's Supabase project credentials |

---

## 3. Feature Verification Status

- ✅ **Verified live** = Tested against a real Supabase project
- 🟡 **Verified with mocks/build only** = Compiles, unit/API-tested, or verified in Demo Mode, not against a live Supabase instance
- 🔴 **Needs external setup** = Requires external Supabase / Google / GitHub / Vercel setup (see `README.md`)

| Feature | Status | Details |
|---|---|---|
| Homepage, 6 Category Families (incl. Books & Learning), Live Bangla Name Preview | 🟡 Verified with mocks/build only | Built & typechecked; 48 products + SVG artwork generated and bundled |
| Catalog Search, Multi-Filters, URL Sync, Sort & Pagination | 🟡 Verified with mocks/build only | Verified in `tests/api.test.ts` and strict build |
| Product Detail, Variant Selection & English/বাংলা Personalization | 🟡 Verified with mocks/build only | Validation unit-tested in `tests/pricing.test.ts` |
| Server-Side Integer BDT Pricing Engine (`shared/pricing.ts`) | 🟡 Verified with mocks/build only | 10 unit tests covering edge cases |
| Cart, Coupons (`BLOOM10`, `WELCOME50`), Gift Wrap & Demo Checkout | 🟡 Verified with mocks/build only | Works in browser Demo Mode (`localStorage`); real Postgres persistence requires Supabase |
| Consolidated Vercel API Routes (8 functions ≤ 12 Hobby limit) | 🟡 Verified with mocks/build only | All 8 function wrappers + `vercel.json` rewrites created |
| Contact & Newsletter Forms (Honeypot + Rate Limit) | 🟡 Verified with mocks/build only | Validated & rate-limit tested in `tests/api.test.ts` |
| Supabase SQL Schema, RLS Policies, `place_order`, Seed (`01`–`05`) | 🔴 Needs external setup | SQL files authored & verified for syntax; must be run in Supabase SQL Editor (`README.md` Section 4) |
| Email Auth, Anonymous Guest Sign-in, Guest→Account Upgrade | 🔴 Needs external setup | Implemented in `useAuth.tsx`; requires Supabase project & Anonymous Sign-ins toggle (`README.md` Sections 5–7) |
| Optional Google OAuth Login | 🔴 Needs external setup | Disabled by default (`VITE_ENABLE_GOOGLE_AUTH=false`); enable via `README.md` Section 8 |
| GitHub Repo & Live Vercel Hosting (`sin1`) | 🔴 Needs external setup | Repo ready; push to GitHub & deploy on Vercel (`README.md` Sections 10–11) |

---

## 4. Bugs Caught & Fixed During QA

1. **TypeScript 7.0 `baseUrl` removal:** Removed deprecated `"baseUrl": "."` from `tsconfig.json`.
2. **Bangla/English separator punctuation in personalization:** Unit test `tests/pricing.test.ts` caught that middle dot (`·`), Bengali dari (`।`), and em-dash (`—`) were rejected by `allowedPattern` in `shared/schemas.ts`; updated the Unicode regex and verified all 17 tests pass.
3. **Zod v4 + React Hook Form resolver compatibility:** Aligned `addressSchema`, `placeOrderSchema`, and `contactFormSchema` input/output types so strict `tsc --noEmit` passes cleanly.
4. **Property casing in `api/_lib/catalog-data.ts`:** Fixed `v.stock_qty` to `v.stockQty` caught by strict TypeScript.

---

## 5. Requires External Configuration (Owner Checklist)

| Item | Where to Configure | README Section |
|---|---|---|
| Create Supabase project (Singapore region) | [supabase.com](https://supabase.com) | Section 3 |
| Run SQL scripts `01_schema.sql` through `05_verify.sql` | Supabase → SQL Editor | Section 4 |
| Enable Anonymous Sign-ins & Email provider | Supabase → Authentication → Providers | Section 5 |
| Copy Project URL, `anon` key, and `service_role` key | `.env` locally / Vercel Env Vars | Section 6 |
| Configure Site URL & Redirect URLs | Supabase → Authentication → URL Configuration | Section 7 |
| (Optional) Google OAuth Client ID & Secret | Google Cloud Console + Supabase + `VITE_ENABLE_GOOGLE_AUTH=true` | Section 8 |
| Push repo to GitHub & deploy to Vercel | GitHub + Vercel | Sections 10–11 |

---

## 6. Design & Requirement Resolutions

1. **Books & Learning Navigation:** Added `Books & Learning` alongside Everyday, Aesthetic, Custom Studio, Art Supplies, and Gift Bundles across top navigation, homepage categories grid, catalog filters, and footer.
2. **Checkout Payment Methods:** Replaced mock bKash/Nagad/SSLCommerz gateways with functional demonstration **Cash on Delivery** and **Pay at Pickup** options, plus a disabled "Digital Wallets & Cards — Coming soon" informational card and prominent demo-store notices.
3. **Shipping Fee Consistency:** Standardised Inside Dhaka City at `৳60` (free when discounted subtotal ≥ `৳1,500`) across `shipping_zones`, pricing engine, homepage trust bar, product accordions, and shipping policy page.
4. **No Fabricated Business Claims:** Removed fake addresses, fake review scores/counts, and fake order counters; replaced testimonials with a truthful "Why Shop With Paper Bloom" strip and product badges (`Bestseller`, `New`, `Personalizable`).
5. **Visual Assets:** Generated 48 consistent bespoke SVG product illustrations (`public/images/products/*.svg`) and 2 editorial SVGs (`hero-flatlay.svg`, `custom-journal.svg`) in the Paper Bloom palette (`#9f3c16`, `#476553`, `#f6fbf5`, `#dec0b7`, `#181d1a`), ready to be replaced later via Supabase Storage `product-images`.

---

## 7. Replace Before Launch (`src/config/site.ts`)

- [ ] `SITE_CONFIG.contact.email`
- [ ] `SITE_CONFIG.contact.phone`
- [ ] `SITE_CONFIG.contact.pickupAddress`
- [ ] `SITE_CONFIG.contact.hours`
- [ ] `SITE_CONFIG.socials.instagram` & `facebook`
- [ ] Legal templates in `src/pages/LegalPages.tsx` (`/privacy` and `/terms`)
- [ ] Product images uploaded to Supabase Storage `product-images` bucket
