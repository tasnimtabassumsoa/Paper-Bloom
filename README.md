# Paper Bloom — Online Stationery & Creative Supplies Store

Welcome to **Paper Bloom**, an online stationery, personalized keepsake, art supply, educational book, and gift bundle storefront built for Dhaka and all 64 districts of Bangladesh.

> **Important Demo Store Notice:** Demo store: placing an order creates a demonstration order. No payment is taken and no goods will be shipped.

---

## 1. What This Is

Paper Bloom is a full-stack e-commerce web application built with React, TypeScript, Tailwind CSS, Vercel Serverless Functions, and Supabase (PostgreSQL + Authentication). When Supabase credentials are not yet configured, it automatically runs in **Demo Preview** mode with sample data stored only in your browser so you can inspect the entire design and storefront experience immediately.

---

## 2. Quick Preview With Sample Data (No Accounts Needed)

You can preview the website on your computer in under 5 minutes without creating any cloud accounts:

1. **Install Node.js (LTS):** Visit [nodejs.org](https://nodejs.org/) and download the **LTS** version (Node 20 or newer). Follow the installer steps.
2. **Open a Terminal in this folder:**
   - **Windows:** Open the project folder in File Explorer, click the address bar, type `cmd`, and press **Enter**.
   - **Mac:** Open **Terminal**, type `cd ` (with a space), drag this project folder into the Terminal window, and press **Enter**.
3. **Install dependencies:**
   ```bash
   npm install
   ```
   *What you should see:* Packages finish downloading without red `ERR!` messages.
4. **Start the preview server:**
   ```bash
   npm run dev
   ```
   *What you should see:* `Paper Bloom dev server running at http://localhost:3000`.
5. **Open in your browser:** Visit `http://localhost:3000`.
   *What you should see:* The Paper Bloom storefront with a dark top bar reading **DEMO PREVIEW — sample data only. Not connected to a database...**. You can browse all 48 products, personalize items in English or বাংলা, test coupons (`BLOOM10` or `WELCOME50`), save wishlists, and place demonstration orders in your browser.

---

## 3. Create Your Supabase Project

To save carts, wishlists, addresses, and demonstration orders in a real database:

1. Go to [supabase.com](https://supabase.com/) and click **Start your project** (sign in with GitHub or email).
2. Click **New project**.
3. Fill in:
   - **Name:** `paper-bloom`
   - **Database Password:** Generate a strong password and save it in a password manager (you do not need to paste this password into the website files).
   - **Region:** Choose **Southeast Asia (Singapore)** (`ap-southeast-1`) for the lowest latency from Bangladesh.
4. Click **Create new project** and wait ~2 minutes until the dashboard says the project is ready.

---

## 4. Run the Database Setup

1. In your Supabase project dashboard, open the left sidebar and click **SQL Editor**.
2. Click **New query**.
3. Open `supabase/01_schema.sql` from this project, copy the entire file, paste it into the SQL Editor, and click **Run**.
   *What you should see:* `Success. No rows returned`.
4. Repeat **New query → Paste → Run** in this exact order:
   1. `supabase/01_schema.sql` (tables, constraints, indexes)
   2. `supabase/02_rls_policies.sql` (Row Level Security on every table)
   3. `supabase/03_functions.sql` (profile auto-creation trigger, rate limiter, atomic `place_order`)
   4. `supabase/04_seed.sql` (6 product families, 48 sample products, 5 shipping zones, `BLOOM10` & `WELCOME50` coupons)
   5. `supabase/05_verify.sql` (checks that RLS is enabled on all 16 tables and counts seeded rows)
   *What you should see after `05_verify.sql`:* Every table shows `rowsecurity = true`, `active_products = 48`, `shipping_zones = 5`, and `active_coupons = 2`.

---

## 5. Enable Guest & Email Login

1. In Supabase, open **Authentication** in the left sidebar, then click **Sign In / Providers** (or **Providers**).
2. Scroll to **Anonymous Sign-Ins**, toggle **Enable Anonymous Sign-ins** ON, and click **Save**.
   *(Recommended for production: also enable Cloudflare Turnstile CAPTCHA protection under Authentication → Bot and Abuse Protection, and periodically clean up stale anonymous users in Supabase.)*
3. Click **Email** in the providers list and make sure **Enable Email provider** is ON.
   - **Confirm email:** While testing, you can turn **Confirm email** OFF so new sign-ups log in immediately. Turn it ON before public launch so visitors verify their email addresses.

---

## 6. Find and Copy Your Credentials

1. In Supabase, click **Project Settings** (gear icon) → **API** (or **API Keys**).
2. Copy `.env.example` to a new file named `.env` in the project root.
3. Paste your values into `.env`:
   - **Project URL** → paste into both `VITE_SUPABASE_URL=` and `SUPABASE_URL=`
   - **anon / public** key → paste into both `VITE_SUPABASE_ANON_KEY=` and `SUPABASE_ANON_KEY=`
   - **service_role / secret** key → paste **ONLY** into `SUPABASE_SERVICE_ROLE_KEY=`

> **Security Warning:** Never put `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_` variable, never share it in chat, and never upload `.env` to GitHub. It gives full server-side access to your database.

---

## 7. Set Website URLs in Supabase

1. In Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to `http://localhost:3000` (update to your Vercel URL once deployed).
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - (Later, after deploying to Vercel) `https://your-project-name.vercel.app/**`
4. Click **Save**.

---

## 8. (Optional) Enable Google Login

Paper Bloom works completely fine with Email and Guest login without Google OAuth. If you want a "Continue with Google" button:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/), create a project, and configure **OAuth consent screen** (External).
2. Go to **Credentials → Create Credentials → OAuth client ID → Web application**.
3. Copy the **Callback URL** shown inside Supabase (**Authentication → Providers → Google**) and paste it under **Authorized redirect URIs** in Google Cloud.
4. Copy your Google **Client ID** and **Client Secret** into Supabase's Google provider settings and toggle **Enable**.
5. In your `.env` (and Vercel Environment Variables), set:
   ```env
   VITE_ENABLE_GOOGLE_AUTH=true
   ```

---

## 9. Run the Full Site Locally (With Vercel CLI or Built-In Dev Server)

This repository supports **both**:
- `npm run dev`: Starts the Express + Vite server on `http://localhost:3000` with all `/api/*` endpoints active.
- **Vercel local emulation (recommended before deploying):**
  1. Install the Vercel CLI once:
     ```bash
     npm install -g vercel
     ```
  2. Log in and run locally:
     ```bash
     vercel login
     vercel dev --listen 3000
     ```
  3. Check `http://localhost:3000/api/health` in your browser. Once `.env` has valid Supabase credentials, it should show `"mode": "connected"` and `"dbReachable": true`.

---

## 10. Put the Project on GitHub

1. Create a free account at [github.com](https://github.com/) and click **New repository** (private or public).
2. Upload the project using **GitHub Desktop** (recommended) or the GitHub web **Add file → Upload files** page.
3. **Never upload `.env`** — the included `.gitignore` automatically hides `.env*`, `node_modules/`, `dist/`, and `.vercel/`.

---

## 11. Deploy on Vercel

1. Sign up at [vercel.com](https://vercel.com/) using your GitHub account.
2. Click **Add New → Project** and import your `paper-bloom` repository.
3. Confirm Framework Preset is **Vite**, Build Command is `npm run build`, Output Directory is `dist`.
4. Expand **Environment Variables** and add all variables from `.env.example`:
   - Public (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ENABLE_GOOGLE_AUTH`, `VITE_SITE_URL` = your live `https://...vercel.app` URL)
   - Server-only secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL` = your live `https://...vercel.app` URL)
5. Click **Deploy**.
6. Copy your new live `https://...vercel.app` URL, add `https://your-site.vercel.app/**` to **Supabase → Authentication → URL Configuration → Redirect URLs** (and Google Cloud Authorized Origins if enabled), then click **Redeploy** in Vercel so `VITE_SITE_URL` takes effect.

*Vercel Hobby plan note:* This project uses **8 consolidated serverless functions** in `/api` (`health`, `catalog`, `cart`, `wishlist`, `me`, `orders`, `contact`, `newsletter`), safely within Vercel Hobby's 12-function limit, deployed to the `sin1` (Singapore) region.

---

## 12. 10-Step Testing Checklist on Your Live Site

1. Visit `/api/health` and confirm `"mode": "connected"` and `"dbReachable": true`.
2. Browse all 6 collections including **Books & Learning**.
3. Search for `"journal"` and test price/customizable filters and sorting.
4. Open a customizable journal, type both English and **বাংলা** text, preview the cover, and add to bag.
5. Refresh the browser and confirm your bag count and item remain saved.
6. Save an item to **Wishlist** and move it to the bag.
7. Apply coupon `BLOOM10` on `/cart` and confirm the 10% discount appears.
8. Complete `/checkout` with a Bangladesh phone number (`017...`), view `/order-confirmation/PB-...`.
9. Register or upgrade your guest session to a full email account and confirm your bag/order history remains attached.
10. Submit the Contact form on `/contact` and Newsletter signup in the footer, then verify rows appear in Supabase **Table Editor**.

---

## 13. Managing Products Without Code

- **Products, Prices & Stock:** Open Supabase → **Table Editor** → `products` or `product_variants` to edit prices (integer BDT), badges, or stock quantities.
- **Shipping Fees & Coupons:** Edit `shipping_zones` or `coupons` directly in **Table Editor**.
- **Product Photos:** Open Supabase → **Storage** → **New bucket** named `product-images` (set **Public bucket** ON). Upload your photos, copy the public URL, and paste it into the `product_images` table (`url` column) for that product.
- **Viewing Orders & Messages:** Check the `orders`, `order_items`, `contact_messages`, and `newsletter_subscribers` tables in Supabase **Table Editor**.

---

## 14. Replace Before Launch (`src/config/site.ts`)

Before sharing with real customers, open `src/config/site.ts` and replace every placeholder:
- `contact.email` (`hello@paperbloom.example`)
- `contact.phone` (`+880 1700-000000`)
- `contact.pickupAddress`
- `contact.hours`
- `socials.instagram` & `socials.facebook`
- Review template text in `src/pages/LegalPages.tsx` (`/privacy` and `/terms`) with a legal advisor.
- Upload real product photography to Supabase Storage `product-images` to replace the bundled SVG illustrations.

---

## 15. Troubleshooting, Security & Project Reference

### Troubleshooting Table

| Symptom | Likely Cause | Fix |
|---|---|---|
| Top banner still says `DEMO PREVIEW` after adding `.env` | `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is blank, or server wasn't restarted | Fill both variables in `.env` and restart `npm run dev` / `vercel dev` |
| Adding to bag shows `Anonymous sign-ins are disabled` | Anonymous auth toggle is off in Supabase | Enable **Anonymous Sign-ins** in Supabase → Authentication → Providers |
| Orders fail with `503` or `SUPABASE_NOT_CONFIGURED` | `SUPABASE_SERVICE_ROLE_KEY` missing on server / Vercel | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` or Vercel Environment Variables |
| `/api/*` works in `npm run dev` but 404s on `npm run dev:vite` | Plain `vite` does not execute `/api` handlers | Use `npm run dev` (Express + Vite) or `vercel dev` |
| Google button does not appear | `VITE_ENABLE_GOOGLE_AUTH` is `false` | Follow Section 8 and set `VITE_ENABLE_GOOGLE_AUTH=true` |

### Security & Free-Tier Notes
- **Keys & RLS:** All browser requests use only the public `anon` key. Every database table has Row Level Security enabled so users can only read/write their own rows. Order creation runs exclusively inside the server-side `place_order` transaction, which ignores client-sent prices and recalculates totals from the database.
- **Free Tier Pausing:** Free Supabase projects pause after 7 days of inactivity (simply click **Restore** in the Supabase dashboard to wake it up).
- **Real Payments Later:** Cash on Delivery and Pay at Pickup are demonstration-only. Integrating real payment gateways (bKash, Nagad, SSLCommerz, or Stripe) requires merchant registration and a dedicated server webhook integration later.

### Project Structure & Scripts
- `api/` — 8 consolidated Vercel serverless functions (`_lib/` holds shared helpers)
- `shared/` — Zod schemas, pricing engine, formatters, constants, 48-product seed
- `src/` — React 19 frontend (`pages/`, `components/`, `hooks/`, `lib/`, `demo/`, `config/site.ts`)
- `supabase/` — Ordered SQL setup (`01` through `05`)
- `tests/` — Vitest unit & API tests + Playwright E2E spec

Scripts:
- `npm run dev` — Local full-stack dev server on port 3000
- `npm run build` — Production Vite build (`dist/`)
- `npm run typecheck` / `npm run lint` — Strict TypeScript check
- `npm test` — Vitest unit & API suite
- `npm run test:e2e` — Playwright E2E suite (requires `npx playwright install`)
- `npm run db:check` — Verify Supabase connection & active product count
