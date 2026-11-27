# PAPER BLOOM — MASTER PROMPT FOR AI CODING ASSISTANT

> **How to use:** Attach `stitch_paper_bloom_stationery_store.zip` (the Google Stitch designs) to the same message, then paste everything below the line. Works with Claude, Google AI Studio, Z.ai, or any capable coding assistant. If the assistant can only reply in chat (no file creation), follow Section 0.4.

---

# ROLE

Act as a senior software architect, full-stack TypeScript engineer, UI/UX engineer, e-commerce specialist and technical writer. You will build the **complete, working, production-ready** e-commerce website for **Paper Bloom**, an online stationery and creative-supplies store based in Dhaka, Bangladesh.

The owner is **not a programmer**. You make every technical decision, write every file, and explain every external setup step in plain language. You never ask the owner to write or edit code. You do not ask unnecessary questions: when something is unspecified, choose a sensible default, document it in the README, and continue.

---

# 0. NON-NEGOTIABLE WORKING RULES

**0.1 Deliver the whole project.** No partial examples, no disconnected snippets, no `// ...rest of the code`, no `TODO: implement`, no "left as an exercise". Every file is complete and every button, link, form, filter and action does something real.

**0.2 Honesty rule.** Never claim something works unless you actually ran or verified it. In every status message and in the final report, label each feature as exactly one of:
- ✅ **Verified live** (tested against a real Supabase project),
- 🟡 **Verified with mocks/build only** (compiles/tests pass but not against a real database),
- 🔴 **Needs external setup** (what, and which README step).

Never describe demo/sample data as connected to a real database.

**0.3 Security rule.** Never put the Supabase `service_role`/secret key, database password, Google client secret or any private credential in frontend code, in git, in logs, or in any `VITE_`-prefixed variable. Never ask the owner to paste secrets into chat.

**0.4 If you cannot create files** (chat-only environment): output the full file tree first, then deliver files in numbered batches, each file in its own code block with its exact path as a heading and its **complete** contents. Say "Batch 3 of N — reply `continue`" at the end of each batch. Do not abbreviate to save space. If you can create files and run commands, do so and run all tests yourself.

**0.5 Work in phases with checkpoints:**
1. Read the Stitch designs and produce a short plan (architecture, file tree, design-token mapping, list of design/requirement conflicts and how you resolved them).
2. Database SQL (schema, RLS, functions, seed).
3. Backend API.
4. Frontend foundation (tokens, layout, shared components, auth, API client).
5. Frontend pages and flows.
6. Demo-mode fallback.
7. Tests, fixes, production build.
8. README and final report.

---

# 1. BUSINESS OVERVIEW

**Paper Bloom** is an online stationery and creative-supplies store in Dhaka, Bangladesh. Currency is **BDT (৳)**. Format prices as `৳1,450` (Taka sign flush against the number, no space, thousands separators, no decimals unless needed). Store all money as integer **poisha-free whole taka** in the database (`integer` columns, e.g. `price_bdt`), never floats.

**Product families (must all exist as categories with real sample products):**
1. **Regular stationery** — notebooks, papers, pens, pencils, erasers, sharpeners.
2. **Customized stationery** — personalized notebooks, diaries, stickers, bookmarks.
3. **Aesthetic stationery** — designer pens, colorful pencils, planners, decorative items (washi tape, wax seals, pressed-flora items).
4. **Art supplies** — canvas, paints, brushes, sketchbooks, color pencils, craft materials.
5. **Educational products** — academic books, storybooks, flashcards, learning materials.
6. **Gift collections** — personalized stationery boxes, study kits, journaling kits.

**Target customers:** school students, college/university students, journaling enthusiasts, book lovers, artists, teachers, parents (buying for children). Copy, filters and collections should speak to them (e.g., "Back-to-school", "Study kits", "Journaling starter", "For teachers", "Gifts under ৳1,000").

**Bangladesh localisation:**
- Phone validation: `^(?:\+?88)?01[3-9]\d{8}$`.
- Delivery zones (stored in a database table, configurable): Inside Dhaka City, Dhaka Suburbs (Savar, Gazipur, Narayanganj, Keraniganj), Chattogram Metropolitan, Sylhet City, All Other Districts, plus Self-pickup. Use the 64-district list for the "district" field.
- Default shipping fees (placeholders, editable in DB): Inside Dhaka ৳60, Dhaka Suburbs ৳100, Chattogram/Sylhet ৳120, Other districts ৳130, Pickup ৳0. **Free delivery inside Dhaka City when the discounted subtotal ≥ ৳1,500** (matches the announcement bar in the designs). Use these values *consistently* everywhere (the Stitch screens show both ৳60 and ৳70 for Dhaka — use the database value everywhere).
- Support **Bangla (Bengali) text**: load a Bengali-capable font (Noto Sans Bengali or Hind Siliguri) as a fallback in the font stack; Bangla must render correctly in personalization fields, addresses, names and order records. Store text as UTF-8. Optionally show Bangla numerals only where explicitly designed; keep prices in Latin digits.
- Language: English UI. (Bilingual UI is out of scope, but all inputs must accept Bangla.)

**Unverifiable business claims.** The Stitch mockups contain invented details (a "Dhanmondi Atelier" at "House 24/A, Road 7", phone `+880 1712-345678`, "hand-bound by master bookbinders", "320+ personalized in Dhaka", "640+ Bangladesh orders", fake customer reviews, "Accepted: bKash/Visa/Mastercard", "256-bit SSL Encrypted Checkout", "Live Concierge Support"). **Do not present invented facts as real.** Put all business identity details (name, address, phone, email, hours, social links, founding year, delivery promises) in one file `src/config/site.ts` populated with clearly marked placeholders, and list every placeholder in a README section "Replace before launch". Remove fake testimonials, fake order counts, fake review counts, and any payment-brand logos or security claims that are not true. Where design needs a testimonial section, replace it with a "Why shop with Paper Bloom" section built from true, structural facts (Cash on Delivery, gift wrapping, personalization service, delivery zones).

---

# 2. DESIGN SOURCE — GOOGLE STITCH FILES (follow closely)

The attached zip contains these folders. **Unzip and read all of them before writing UI code.**

| Folder | Contents | Use for |
|---|---|---|
| `warm_editorial_craft/DESIGN.md` | Design system: palette, typography, spacing, radii, elevation, components | Design tokens and component rules |
| `home_paper_bloom` + `home_paper_bloom_desktop` | `code.html` + `screen.png` (mobile + desktop) | Homepage |
| `shop_catalog_paper_bloom` + `_desktop` | same | Catalog / listing page, filters, sorting |
| `product_customization_paper_bloom` + `_desktop` | same | Product detail + personalization |
| `cart_checkout_paper_bloom` + `_desktop` | same | Cart + 3-step checkout |
| `cozy_aesthetic_stationery_flat_lay_banner_…` | `screen.png` (photo) | Hero/banner image asset |
| `professional_product_photo_of_a_customized_…_vegan_leather_journal` | `screen.png` (photo) | Product photo asset |

**How to use them**
- Treat `screen.png` files as the **visual source of truth** and `code.html` as a static mockup (Tailwind via CDN, hard-coded content, no logic). **Rebuild every screen as real React components**; do not paste the HTML. Preserve layout, spacing, hierarchy, copy tone, components and interactions as closely as practical, at both mobile and desktop widths. Tablet layouts must be designed by interpolating between them (8-column grid per DESIGN.md).
- **Design tokens:** the `tailwind.config` inside each `code.html` (Material-style names: `primary #9f3c16`, `primary-container #bf542c`, `secondary #476553`, `secondary-container #c7e8d1`, `surface #f6fbf5`, `on-surface #181d1a`, `outline-variant #dec0b7`, plus `space-*`, `gutter`, `margin-*`, and the `display-lg / headline-* / body-* / label-* / currency-*` type scale) matches what the screenshots actually render. Port these into `tailwind.config.ts` under the same names. `DESIGN.md` prose quotes slightly different hex values (e.g., `#C85A32` terracotta, `#FAF8F5` canvas); where the two disagree, **follow the screenshots/code.html tokens**, and mention the decision in the README. Keep the brand character: terracotta rust CTAs, muted sage secondary, warm sand borders, deep-ink text, Playfair Display headlines (with italic emphasis), Plus Jakarta Sans body/prices, 4:5 product images, 1px fine borders, soft paper-like shadows, pill chips/badges, 44×44px minimum touch targets, mobile sticky "Add to Bag" bar, bottom-sheet filter drawer on mobile.
- Icons: the designs use **Material Symbols Outlined**. Use the icon font (or an equivalent inline-SVG set such as `lucide-react`) consistently; do not mix styles.
- Self-host or preload fonts in a performance-friendly way; always provide fallbacks (`font-display: swap`).

**Gaps and conflicts to resolve (mandatory):**
1. The designs' nav has 5 items (Everyday, Aesthetic, Custom Studio, Art Supplies, Gift Bundles). The business also sells **Educational products** — add "Books & Learning" to the nav, home category grid, footer and catalog filters, designed in the same style.
2. The Stitch checkout shows bKash/Nagad/card payment, a "bKash popup", SSLCommerz and "cashback". **Implement none of these.** Show the payment step as: **Cash on Delivery (selected, functional)** and, for pickup, **Pay at pickup**. If you display bKash/Nagad/Card tiles for visual fidelity, they must be visibly disabled with a "Coming soon" tag and no brand logos/claims. Remove "Sign in / bKash OTP", "Seamless MFS Gateway", etc.
3. **Demonstration notice:** on the checkout and confirmation pages, and in the footer, show a clear, tasteful notice: *"Demo store: placing an order creates a demonstration order. No payment is taken and no goods will be shipped."* Add the same sentence to the confirmation email-like summary screen, FAQ and README.
4. Several Stitch images are remote/broken placeholders. **Do not hot-link random third-party images.** Image strategy: (a) extract the two real photos from the zip into `public/images/` (optimise to WebP, sensible sizes); (b) create tasteful, consistent **generated placeholder artwork** for the other products (inline SVG/CSS product illustrations in the Paper Bloom palette, one visual style, different per product type/colour), stored under `public/images/products/`; (c) design the `product_images` table and `<ProductImage>` component so the owner can later upload real photos to Supabase Storage (document this in the README, including creating a public bucket named `product-images`). Every image has meaningful `alt` text, explicit width/height, and lazy loading below the fold.
5. Remove star ratings and review counts unless backed by a real `product_reviews` table. **Decision:** do not build reviews now; show badges instead ("Bestseller", "New", "Personalizable", "Free gold foil"). "Popularity" sorting is based on a real `popularity_score` column plus order counts.

---

# 3. TECH STACK AND PROJECT STRUCTURE

**Frontend:** React 18 + TypeScript (strict) + Vite + Tailwind CSS 3, React Router, TanStack Query (server state), React Hook Form + Zod (forms/validation), `@supabase/supabase-js` (auth only on the client), Framer Motion (or CSS transitions) for tasteful motion. Respect `prefers-reduced-motion`.

**Backend:** Node.js + TypeScript **Vercel Serverless Functions** in `/api`, Zod validation, shared types in `/shared`.

**Database/Auth:** Supabase (PostgreSQL + Auth + optional Storage).

**Vercel Hobby plan limit:** max 12 serverless functions per deployment. **Do not create one file per endpoint.** Consolidate into a small number of functions (e.g., `api/catalog/[...path].ts`, `api/cart/[...path].ts`, `api/me/[...path].ts`, `api/orders/[...path].ts`, `api/contact.ts`, `api/health.ts`) with a tiny internal router and shared middleware under `/api/_lib/` (underscore-prefixed folders are not deployed as routes). Document the count in the README.

**Required repo layout (adjust only if justified):**
```
paper-bloom/
├─ api/                       # Vercel functions (+ api/_lib shared helpers)
├─ shared/                    # Zod schemas, DTO types, pricing utils shared by FE/BE
├─ src/
│  ├─ app/ (router, providers)
│  ├─ components/ (ui/, layout/, product/, cart/, checkout/, account/)
│  ├─ pages/
│  ├─ lib/ (apiClient, supabaseClient, format, analytics-free)
│  ├─ hooks/
│  ├─ config/site.ts
│  ├─ demo/ (demo data + demo-mode adapters)
│  └─ styles/
├─ public/ (images, favicon, robots.txt)
├─ supabase/
│  ├─ 01_schema.sql
│  ├─ 02_rls_policies.sql
│  ├─ 03_functions.sql
│  └─ 04_seed.sql            # sample data (idempotent)
├─ tests/ (unit, API, e2e)
├─ .env.example
├─ vercel.json
├─ package.json, tsconfig*.json, tailwind.config.ts, postcss.config.js, vite.config.ts, eslint config
├─ .gitignore (must ignore .env*, node_modules, dist, .vercel)
└─ README.md
```
Pin Node 20 (`engines`), include scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:e2e`, `db:check`. Explain that the full app (frontend + API) is run locally with `vercel dev` (plain `vite` does not run `/api`), and make that the documented local command with a one-time `npm i -g vercel` step.

Do not require Gemini, Claude or any paid AI API for the site to function. Do not add analytics/trackers or third-party scripts.

---

# 4. DATABASE (SUPABASE POSTGRESQL)

Write complete, runnable, **idempotent-where-reasonable** SQL files (to be pasted into the Supabase SQL Editor in order). Use `uuid` PKs (`gen_random_uuid()`), `timestamptz` timestamps with `now()` defaults, `updated_at` triggers, `CHECK` constraints (non-negative prices/quantities, valid status enums), proper `ON DELETE` rules, and indexes on every foreign key and on search/filter/sort columns (slug, category, price, is_active, popularity, trigram or full-text index for search).

**Tables (minimum):**
- `profiles` — `id` = `auth.users.id`, full_name, phone, avatar_url, is_guest (mirrors `is_anonymous`), created/updated. Auto-created by a trigger on `auth.users` insert (`SECURITY DEFINER`, safe `search_path`), including for anonymous users.
- `categories` — id, slug, name, description, parent_id (nullable, for sub-categories), image, sort_order, is_active. Seed the 6 families as top-level (plus the Stitch nav labels as display names, e.g. "Everyday Stationery", "Aesthetic Stationery", "Custom Studio", "Art Supplies", "Books & Learning", "Gift Bundles") and sensible sub-categories (notebooks, pens, pencils, erasers & sharpeners, planners, washi & decor, canvas, paints, brushes, sketchbooks, craft materials, academic books, storybooks, flashcards, study kits, journaling kits, etc.).
- `products` — id, slug, name, short_description, description, category_id, product_type (`ready` | `customizable` | `bundle`), base_price_bdt, compare_at_price_bdt (nullable, for strikethrough), badge, is_customizable, personalization_fee_bdt, personalization_config (jsonb: fields, character limits, allowed styles/colours, supports_bangla, lead-time text), tags (text[]), specs (jsonb), popularity_score, is_featured, is_active, stock tracking mode, created/updated.
- `product_images` — product_id, url/storage_path, alt_text, sort_order, is_primary.
- `product_variants` — product_id, sku (unique), name, option values (size, colour, paper type etc. as jsonb), price_override_bdt (nullable), stock_qty, is_active. Every product has at least one default variant so cart/order logic is uniform.
- `shipping_zones` — code, name, fee_bdt, free_over_bdt (nullable), eta_text, is_pickup, is_active.
- `coupons` — code, percent_off or amount_off_bdt, min_subtotal_bdt, max_discount_bdt, starts_at, ends_at, usage_limit, used_count, is_active. Seed `BLOOM10` (10% off, as in the design) and one welcome code. Applying a coupon is validated **only on the server**.
- `carts` — id, user_id (unique per active cart), status, timestamps. `cart_items` — cart_id, product_id, variant_id, quantity (1–20), `personalization` jsonb (nullable), `personalization_hash` (so identical products with different personalization are separate lines), unique(cart_id, variant_id, personalization_hash).
- `wishlists` / `wishlist_items` — user_id, product_id, unique pair.
- `addresses` — user_id, label, recipient_name, phone, zone_code, district, thana/area, address_line, landmark, postal_code, is_default (partial unique index ensuring one default per user).
- `orders` — id, order_number (unique, human-friendly, e.g. `PB-261127-4821`), user_id, status (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`), payment_method (`cod`, `pickup`), payment_status (`unpaid`), **`is_demo boolean default true`**, customer snapshot (name, phone, email), shipping address snapshot (jsonb or columns), zone_code, subtotal_bdt, personalization_fees_bdt, discount_bdt, coupon_code, shipping_fee_bdt, total_bdt, gift_wrap boolean, gift_message, customer_note, idempotency_key (unique per user), created_at.
- `order_items` — order_id, product_id (nullable on delete), variant_id, **snapshotted** name/sku/image/unit_price/personalization/personalization_fee/line_total, quantity.
- `contact_messages` — name, email, phone, subject, message, created_at (insert via API only).
- `newsletter_subscribers` — email (unique), created_at (the footer form in the designs must work).

**Row Level Security (enable on every table, no exceptions):**
- Catalog tables (`categories`, `products`, `product_images`, `product_variants`, `shipping_zones`): public `SELECT` of active rows only; no public writes.
- `profiles`, `addresses`, `carts`, `cart_items`, `wishlists`, `wishlist_items`: a user can only select/insert/update/delete rows where `user_id = auth.uid()` (anonymous users included, since they have a real `auth.uid()`).
- `orders`, `order_items`: users can **select only their own**; **no direct client insert/update/delete**. Orders are created exclusively by the server through the `place_order` function using the service role.
- `coupons`, `contact_messages`, `newsletter_subscribers`: no client access; server only.
- Grant/revoke explicitly (`REVOKE ALL ... FROM anon, authenticated` then grant what is needed). Include a **verification script** (`supabase/05_verify.sql`) with queries that prove RLS is on for every table and list every policy.

**Order-placement function:** `place_order(...)` as a `SECURITY DEFINER` Postgres function (execute granted to `service_role` only) that, in **one transaction**: locks and reads the user's cart, re-reads current prices from `products/variants`, verifies stock and `is_active`, validates personalization against `personalization_config`, applies coupon rules, computes shipping from `shipping_zones`, decrements stock, writes `orders` + `order_items` snapshots, empties the cart, and returns the order. Enforce idempotency via `idempotency_key` (repeat submission returns the same order, not a duplicate).

**Seed data (`04_seed.sql`):** at least **48 realistic active products** spread across all 6 families and their sub-categories, with prices in BDT between ৳50 and ৳3,500 that look credible for Bangladesh (e.g., a pencil ৳15–30, a ruled notebook ৳120–280, designer gel pens ৳60–450, a personalized journal ৳750–1,200, art-supply sets ৳350–2,500, storybooks ৳180–650, study/journaling kits ৳850–2,400). Include: descriptive copy (2–4 sentences each), specs, 1–4 images each, variants (colour/size) for at least 15 products, ≥ 12 customizable products with realistic `personalization_config` (name/initials/year text, Bangla allowed, colour of foil, font style, a note), `compare_at_price_bdt` on some products for discounts, featured/bestseller flags, shipping zones, coupons. Use only generic product descriptions; do not copy copyrighted product text, brand names or book cover images (use generic titles like "Bangla Rhymes Storybook for Early Readers").

---

# 5. AUTHENTICATION (SUPABASE AUTH)

Implement all of these and make each work end-to-end:
1. **Browse without signing in** — all catalog pages and APIs are public.
2. **Continue as Guest** — Supabase **anonymous sign-in** (`signInAnonymously`). A guest has a real `auth.uid()`, so cart, wishlist and demo checkout persist in the database across refreshes and reopening the browser (session stored by supabase-js). Trigger anonymous sign-in lazily: the first time the visitor adds to cart/wishlist or presses "Continue as Guest", not on every page view. Show a small "Guest" indicator with a prompt to create an account to keep orders across devices.
3. **Email registration & login** — with validation, clear error messages, password reset ("Forgot password") and the email-confirmation flow handled gracefully (document both settings: confirmation on/off).
4. **Continue with Google** — optional. The button is shown only when `VITE_ENABLE_GOOGLE_AUTH=true`. If not configured, the site and guest access must work perfectly and no broken Google button appears. Handle the OAuth redirect/callback route.
5. **Upgrade guest → account** — when a guest registers or signs in with Google, **preserve their cart/wishlist** by linking the identity to the anonymous user (`updateUser` with email+password, or `linkIdentity` for Google) rather than creating a separate user. Handle the case where an existing account is chosen (merge cart items server-side via a tested endpoint, then discard the guest cart).
6. **Secure logout** — clears the session, React Query cache and any local data; protected pages redirect appropriately.
7. **Customer profile management** — edit name/phone, manage multiple addresses (add/edit/delete/set default), view order history and order details, change password (non-guest), delete-account request is optional.

**Server-side JWT validation:** every protected API route reads the `Authorization: Bearer <access_token>` header and verifies it with Supabase (`auth.getUser(token)` or JWKS verification); never trust a user id sent in the body or query. Flag whether the user is anonymous (`is_anonymous`) from the verified token. Use a **user-scoped Supabase client** (with the user's JWT) for user-owned data so RLS applies as defence in depth, and use the **service-role client only** inside server code for `place_order`, coupon usage, contact messages and newsletter signups.

**Hardening:** recommend enabling Supabase CAPTCHA/Turnstile for anonymous sign-ins in the README (optional step, explained simply), rate-limit sensitive routes, and write the README note that anonymous users are cleaned up by Supabase settings/maintenance.

---

# 6. BACKEND API

**Conventions:** base path `/api`. JSON only. All responses use one envelope:
```json
{ "ok": true,  "data": { ... }, "meta": { "page": 1, "pageSize": 24, "total": 120 } }
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "Human readable", "details": [ { "field": "phone", "message": "..." } ] } }
```
Use correct HTTP status codes (400/401/403/404/409/422/429/500). Never leak stack traces or SQL errors. Validate every body/query/param with Zod schemas from `/shared`. Add a central error handler, request-id, method guards, CORS limited to `SITE_URL`, security headers (via `vercel.json`: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/frame-ancestors, a sensible CSP that allows Supabase and your font host), basic per-IP rate limiting for auth-adjacent, contact, newsletter and checkout routes (use a lightweight approach that works on serverless, e.g., a Postgres-backed counter or documented best-effort limiter), and request body size limits.

**Endpoints (consolidated into few functions as in Section 3):**
- **Catalog (public):** `GET /api/products` (query: `q`, `category`, `type`, `minPrice`, `maxPrice`, `customizable`, `inStock`, `tag`, `sort=featured|price_asc|price_desc|popular|newest`, `page`, `pageSize`) · `GET /api/products/:slug` (images, variants, related items) · `GET /api/categories` (tree with counts) · `GET /api/search/suggest?q=` · `GET /api/shipping-zones` · `GET /api/featured` (home sections).
- **Cart (auth):** `GET /api/cart` · `POST /api/cart/items` · `PATCH /api/cart/items/:id` · `DELETE /api/cart/items/:id` · `DELETE /api/cart` · `POST /api/cart/coupon` · `DELETE /api/cart/coupon` · `POST /api/cart/merge`. The cart response always contains **server-calculated** line totals, subtotal, personalization fees, discount, estimated shipping, total, and per-line warnings (out of stock / price changed).
- **Wishlist (auth):** `GET`, `POST /api/wishlist/:productId`, `DELETE /api/wishlist/:productId`, `POST /api/wishlist/:productId/move-to-cart`.
- **Me (auth):** `GET/PATCH /api/me`, `GET/POST /api/me/addresses`, `PATCH/DELETE /api/me/addresses/:id`.
- **Checkout/Orders (auth):** `POST /api/checkout/quote` (totals preview for a zone/coupon) · `POST /api/orders` (requires `Idempotency-Key`; calls `place_order`) · `GET /api/orders` · `GET /api/orders/:orderNumber` (only the owner).
- **Public forms:** `POST /api/contact`, `POST /api/newsletter` (honeypot field + rate limit).
- **Health:** `GET /api/health` → reports `{ api: true, supabaseConfigured: bool, dbReachable: bool }` without exposing secrets (used by the demo/connected badge and the README test step).

**Money rules (critical):** the client may send only product/variant ids, quantities, personalization values, coupon code, zone code and address — **never prices, totals, discounts or fees**. The server recomputes everything from the database on every cart read, quote and order. Pricing order: unit price (variant override or product base) × qty → + personalization fee (per unit, when personalized) → minus coupon (percent/amount, respecting min subtotal and max discount) → shipping from the zone (free rule applied on the discounted subtotal) → total. Put the pure calculation in `/shared/pricing.ts` with **unit tests** (edge cases: free-shipping threshold, coupon caps, personalization fees, rounding, zero items, price change between cart and order).

**Order flow:** validate cart not empty → validate address/phone/zone → validate personalization (length, allowed characters, Bangla allowed, profanity-free basic check optional) → `place_order` → return order number and full summary. Duplicate clicks must not create duplicate orders. Order status starts at `pending`; payment method `cod`; `is_demo = true`.

---

# 7. FRONTEND — PAGES AND FEATURES

Routes (React Router, lazy-loaded, with scroll restoration, per-page `<title>`/meta description, a branded 404 and error boundary):

`/` Home · `/shop` (all) · `/shop/:categorySlug` · `/search?q=` · `/product/:slug` · `/cart` · `/checkout` · `/order-confirmation/:orderNumber` · `/wishlist` · `/login` · `/register` · `/forgot-password` · `/reset-password` · `/auth/callback` · `/account` (profile) · `/account/orders` · `/account/orders/:orderNumber` · `/account/addresses` · `/about` · `/contact` · `/faq` · `/shipping-returns` · `/privacy` · `/terms`.

**Global layout (per Stitch):** announcement bar (free Dhaka delivery over ৳1,500, config-driven), sticky header with logo/wordmark ("Paper Bloom" + tagline), category nav with a mega/dropdown on desktop and a slide-in menu on mobile, expandable search with live suggestions, wishlist icon with count, bag icon with count and running total (matching the designs), account menu (Sign in / Continue as guest / profile / orders / logout), and a rich footer (shop links, customer care, contact details from `site.ts`, newsletter form that really saves, demo-store notice). Mobile bottom sticky bars where designed.

**Home:** hero (headline with italic emphasis, two CTAs, trust points, hero image), curated categories grid (6 families incl. Books & Learning, "From ৳…" computed from real data), featured/bestseller product carousel/grid with "All / Personalized only" toggle, "How Personalization Works" 3-step section with the live **name preview** widget (type a name/Bangla text → preview on a journal cover mock, purely client-side), gift-collections banner, "Why Paper Bloom" strip, new arrivals, newsletter.

**Catalog:** breadcrumbs, result count, desktop sidebar filters and mobile bottom-sheet filters (category/sub-category, price range slider with min/max inputs, product type: ready/customizable/bundle, personalization method, in stock), active-filter chips with "Clear all", sort (Featured, Price low→high, Price high→low, Most popular, Newest), URL-synced state (shareable/back-button-safe), pagination or "Load more", skeleton loaders, empty state, error state with retry. Product cards (4:5 image, badge, wishlist heart with optimistic update, price with strikethrough and "Save %", quick "Add" or "Personalize" CTA that opens the product page for customizable items).

**Product detail:** image gallery with thumbnails, zoom/lightbox and swipe on mobile; breadcrumbs; title, price, discount; variant selectors (size/colour) with live price and stock state; **personalization panel** (fields from `personalization_config`: name/text, language note supporting Bangla, foil colour, font style, optional note; character limits; live preview as in the Stitch design; clear fee line "Personalization +৳X"); quantity stepper; Add to Bag (with confirmation drawer/toast and cart count update); Add to Wishlist; delivery info accordion (zones, fees, ETAs); return policy accordion (custom items non-returnable except for our error — state it truthfully and consistently with the policy page); materials/specs; related products; mobile sticky purchase bar.

**Cart:** line items with image, variant, personalization summary (editable), quantity stepper, remove, move to wishlist; coupon field (valid code `BLOOM10` shows success state; invalid shows error); gift-wrap toggle (free/priced per config); shipping estimate by zone; order summary with every figure from the server; empty-cart state; stock/price-change warnings; "Continue shopping".

**Checkout (3 steps as in Stitch: Cart → Delivery & Details → Confirmation):** guests and signed-in users both allowed; contact details (name, phone, email optional), address form with saved-address picker (signed-in), zone/district selector (changes shipping fee live through `/checkout/quote`), landmark, gift message/note, shipping method, payment method (**Cash on Delivery** / **Pay at pickup**), prominent demo notice, order summary, terms acknowledgement, "Place demo order" button (disabled while submitting; idempotency key generated per attempt). Inline validation with accessible error messages.

**Order confirmation:** order number, status, items with personalization, totals, delivery address and ETA, demo notice, "Track in My Orders" (for guests: explain they must create an account to keep orders across devices), buttons to keep shopping.

**Account:** profile form, addresses CRUD, order list with status chips and order detail, wishlist, logout. Guests see an "Upgrade to a full account" panel.

**Static pages:** About Us (brand story written in warm, honest, non-exaggerated copy; no fabricated awards/statistics), Contact (working form → `contact_messages`, plus details from `site.ts`, map embed **not** required), FAQ (accordion; includes ordering, personalization, Bangla text, delivery, COD, demo-store status), Shipping & Returns (zones, fees, times, replacement/return rules), Privacy and Terms (sensible plain-language templates clearly marked as templates the owner should review with a legal professional).

**UX/quality requirements:** loading skeletons, optimistic cart/wishlist updates with rollback on error, toast notifications, focus management, keyboard navigation, visible focus rings, WCAG AA colour contrast, semantic HTML, `aria` labels, form labels, `alt` text, 44px touch targets, no layout shift, Lighthouse targets (Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90 on mobile for home and product pages where measurable), code-splitting, image optimisation, `robots.txt`, sitemap-friendly structure, Open Graph tags, JSON-LD `Product` markup on product pages.

Every nav link, footer link, button, form, filter, sort control, cart/wishlist action and checkout action must work; no dead `href="#"`.

---

# 7A. DEMO MODE (when Supabase credentials are missing)

If the Supabase environment variables are absent, the app must still run as a **clearly labelled demo preview** using bundled sample data (`src/demo/`), so the owner can see the design immediately after `npm install`.
- Show a persistent, unmistakable banner: **"DEMO PREVIEW — sample data only. Not connected to a database. Carts, wishlists and orders are stored in this browser only and are not real."** Also show the state on the order confirmation page.
- Demo-mode cart/wishlist may use `localStorage` (only in demo mode); real mode must never use `localStorage` as the data store (only the Supabase auth session).
- Demo mode must use the *same* components and the *same* pricing utilities; only the data adapter differs. Auth buttons in demo mode explain what is needed instead of pretending to log in.
- `GET /api/health` and the UI must reflect the true state (`demo` vs `connected`). **Never claim demo data is connected to a real database.**

---

# 8. ENVIRONMENT VARIABLES (`.env.example`)

Provide a fully commented `.env.example` (no real values) with, at minimum:
```
# Safe for the browser (public)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=        # anon / publishable key
VITE_ENABLE_GOOGLE_AUTH=false
VITE_SITE_URL=http://localhost:3000

# SERVER ONLY — never prefix with VITE_, never commit
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # service_role / secret key
SITE_URL=http://localhost:3000
```
The code must fail with a **friendly, specific message** (not a crash) when a variable is missing, and must validate env vars at startup with Zod. Build must not bundle any server-only variable (verify by grepping `dist/` for the service key name/pattern and report the result).

---

# 9. DEPLOYMENT (VERCEL + GITHUB)

Provide `vercel.json` with: SPA fallback rewrite that **excludes** `/api/*`, security headers, caching headers for hashed assets, function runtime/region settings (prefer a region near Singapore, e.g. `sin1`, and document that Supabase should be created in the Singapore region for lowest latency from Bangladesh), and `maxDuration` appropriate for the plan. Ensure `npm run build` passes with zero TypeScript errors and no ESLint errors, and that the project deploys on Vercel with the **Vite** framework preset (Build: `npm run build`, Output: `dist`).

The repo must be GitHub-ready: tidy commits are optional, but include `.gitignore`, `.gitattributes`, a `LICENSE` placeholder note, and an optional GitHub Actions CI workflow (typecheck + lint + unit tests + build).

---

# 10. README — BEGINNER-FRIENDLY SETUP (click-by-click)

Write `README.md` for a non-programmer: short sentences, numbered steps, exact button and menu names, "what you should see" after each step, and a **Troubleshooting** table (symptom → cause → fix). Include these sections:

1. **What this is** (one paragraph, includes the demo-store disclaimer).
2. **Quick preview with sample data (no accounts needed):** install Node.js (link, "choose LTS"), unzip the project, open a terminal in the folder (explain how on Windows and Mac), `npm install`, `npm run dev`, open the address. Explain the DEMO PREVIEW banner.
3. **Create your Supabase project:** go to supabase.com → sign up → **New project** → name, strong database password (save it in a password manager; you will not need it in the website), region **Southeast Asia (Singapore)** → wait for setup.
4. **Run the database setup:** left menu **SQL Editor** → **New query** → paste `01_schema.sql` → **Run**; repeat for `02`, `03`, `04`, and `05_verify.sql`. Say what success looks like and what a common error means.
5. **Enable Guest login:** **Authentication → Sign In / Providers** (or **Providers**) → enable **Anonymous sign-ins**. Enable **Email** provider; explain "Confirm email" on/off and recommend off while testing.
6. **Find and copy your credentials:** **Project Settings → API** (or **API Keys**): *Project URL*, *anon/publishable key* (public) and *service_role/secret key* (private — explain in plain words that it must never be shared, posted or put in the frontend). Show exactly which `.env` line each value goes into.
7. **Set the website URLs in Supabase:** **Authentication → URL Configuration**: Site URL and Redirect URLs for `http://localhost:3000/**` and the future Vercel domain.
8. **(Optional) Google login:** Google Cloud Console → create project → OAuth consent screen (External) → **Credentials → Create OAuth client ID → Web application** → add the Supabase callback URL shown in **Authentication → Providers → Google** as an authorised redirect URI → copy Client ID and Client Secret into Supabase's Google provider → toggle **Enable** → set `VITE_ENABLE_GOOGLE_AUTH=true`. State clearly that the site works fine without this.
9. **Run the full site locally** with `vercel dev` (one-time installation of the Vercel CLI and login explained).
10. **Put the project on GitHub:** create account → **New repository** (private is fine) → upload with GitHub Desktop (recommended for beginners) or the web **Add file → Upload files** (warn: never upload `.env`; explain `.gitignore`).
11. **Deploy on Vercel:** vercel.com → sign up with GitHub → **Add New → Project** → import the repo → Framework **Vite** → **Environment Variables** (list each name; mark which are secret) → **Deploy** → copy the live URL → add it to Supabase **URL Configuration** (and to Google's authorised origins if used) → **Redeploy**.
12. **Testing your live site:** a 10-step manual checklist (register, guest, add to cart, refresh, wishlist, checkout, confirmation, order history…).
13. **Managing products without code:** Supabase **Table Editor** for editing products, prices, stock, coupons and shipping fees; uploading product photos to **Storage** bucket `product-images` and linking them; how to view orders and contact messages.
14. **Replace before launch:** all placeholders from `site.ts` (address, phone, email, hours, social links, policy text, product photos).
15. **Security notes** in plain language (keys, RLS, what "demo order" means), **Free-tier notes** (Supabase free projects can pause after inactivity; Vercel Hobby limits), **Going live properly later** (real payment gateways such as bKash/Nagad/SSLCommerz/Stripe are *not* included and would be a separate project), **Project structure** and **Scripts**.

---

# 11. TESTING AND QUALITY ASSURANCE

Run everything you can and **fix every failure before delivering**. Required coverage:

- **Static:** `tsc --noEmit` (strict), ESLint, production `npm run build`, bundle-size review, secret-leak grep on `dist/` and git-tracked files.
- **Unit tests (Vitest):** pricing/shipping/coupon/personalization-validation logic; formatters (৳, phone, dates); Zod schemas.
- **API tests:** every endpoint — success, validation failure, unauthenticated (401), forbidden (403), not found (404), rate limiting, idempotent order placement, tampering attempts (client-sent price ignored, other user's cart/order id rejected).
- **Database tests (against a real Supabase project if credentials are available):** schema applies cleanly twice (idempotent), seed loads, RLS verification (user A cannot read user B's cart/orders/addresses; anonymous user can only access own data; anon role cannot write catalog), `place_order` atomicity and stock decrement, constraint violations rejected.
- **Auth:** email register/login/logout, password reset flow, guest sign-in, guest→account upgrade with cart preserved, Google flow (only if configured; otherwise report 🔴).
- **E2E (Playwright, desktop + mobile viewports):** browse → search → filter → sort → open product → choose variant → personalize (incl. Bangla text) → add to cart → refresh (cart persists) → wishlist → apply `BLOOM10` → checkout as guest → confirmation → reopen site (session + order still exist) → account order history.
- **Responsiveness:** screenshots at 360, 390, 768, 1024, 1280, 1536 px; compare against the Stitch `screen.png` files and list any deviations.
- **Navigation:** crawl all internal links and routes to confirm no broken links/404s/dead buttons.
- **Accessibility and performance:** automated axe checks and a Lighthouse run when possible.
- **Deployment compatibility:** confirm function count ≤ 12, `vercel.json` validity, SPA fallback not swallowing `/api`, environment variables documented, cold-start-safe code, no filesystem writes at runtime.

If you cannot run something (no network, no Supabase credentials, no browser), say so explicitly, mark it 🟡/🔴, and write the exact command or manual steps the owner can run.

---

# 12. FINAL DELIVERABLES

Deliver all of the following:
1. A complete, working Paper Bloom e-commerce website (frontend + backend + database).
2. All frontend and backend source files.
3. Complete Supabase SQL setup, RLS policies, functions, verification script and sample data.
4. Secure authentication (email, Google optional, anonymous guest, logout, profile).
5. A responsive, professional UI that closely follows the Stitch designs.
6. A complete beginner-friendly `README.md`.
7. `.env.example`.
8. A GitHub-ready repository structure.
9. `vercel.json` and deployment configuration.
10. **`TESTING_REPORT.md`** containing: test environment, what was tested and how, results per feature using the ✅/🟡/🔴 labels, bugs found and fixed, remaining limitations, a table of **"Requires external configuration"** items (Supabase project, SQL run, anonymous sign-in toggle, credentials, URL configuration, optional Google, GitHub, Vercel env vars), a list of every deviation from the Stitch designs with reasons, and the "Replace before launch" checklist.

# DEFINITION OF DONE

The work is complete only when: the production build passes; all buttons, links, forms, filters, cart, wishlist and checkout actions work; data (session, cart, wishlist, addresses, orders) persists across refresh and reopening; prices and totals are calculated only on the server; RLS is enabled and verified on all tables; no private key exists anywhere in the frontend bundle or repository; demo mode is truthfully labelled; the checkout is clearly a demonstration; the README lets a complete beginner go from zero to a live Vercel site; and the final testing report is honest about what is verified and what still needs the owner's external setup.

Begin with Phase 1 now: read the attached Stitch files, then present the plan (architecture, file tree, token mapping, conflict resolutions). Then continue through all phases without stopping to ask permission, pausing only if you truly cannot proceed.
