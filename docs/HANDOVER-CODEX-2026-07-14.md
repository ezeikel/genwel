# Genwel — Handover to Codex (2026-07-14)

Handover from a Claude Code session. Two small web fixes, then **build the mobile app
end-to-end** on the existing Expo scaffold, mirroring the web product.

> **Source session (Claude Code):** `claude.ai/code/session_0158YjKHB7wemWomSMqv8ib4`
> **Transcript (full tool calls + reasoning):**
> `/Users/ezeikel/.claude/projects/-Users-ezeikel-Development-Personal-genwel/7195533d-2ec5-4e6e-bd6c-49fa76983625.jsonl`
> **Prior audit + decisions (read these first):**
> - `docs/PROD-AUDIT-2026-07-14.md` — full prod readiness audit (both launch blockers now RESOLVED)
> - `docs/LAUNCH-AUDIT-2026-07.md`, `docs/PRICING-PLAN.md`, `docs/ASK-GENWEL-PLAN.md`
> - `CLAUDE.md` (repo root + `~/Development/Personal/CLAUDE.md`) — monorepo + Chewy Bytes conventions

---

## 0. Current state of the product (so you have context)

**Genwel** is a live UK money app (marketing site + logged-in "money command centre") at
**www.genwel.com**. Monorepo: Turborepo + pnpm.
- `apps/web` — Next.js 16.2.9, the live product (marketing + dashboard). **Done & shipping.**
- `apps/mobile` — Expo SDK 56 / RN 0.85 / expo-router / NativeWind. **Auth stub only — your main job.**
- `packages/db` — Prisma/Neon. `packages/banking` (`@genwel/banking`) — TrueLayer + merchant + models.

**Verified working in prod this session:**
- Auth: magic-link (Resend) + Google/Apple/Facebook OAuth.
- Real bank connections via TrueLayer **production** (real NatWest accounts syncing).
- **Stripe billing end-to-end** (live checkout → webhook → Pro entitlement). Promo `GENWELTEAM` = 100% off (live).
- Dashboard: net worth, accounts, transactions, **subscriptions** (just fixed — see §3 history),
  insights, budgets, **Ask Genwel** (streaming AI chat over real data, Pro-gated).
- Mobile bottom nav pattern for web: floating glass tab bar (`components/dashboard/MobileTabBar.tsx`)
  + full-screen account modal (`MobileHeaderMenu.tsx`). This is the pattern to mirror in RN.

**Brand tokens:** teal `--primary` `#1a5a5a`, gold `--accent` `#d4a03c`, cream `#faf9f7`,
`bg-card / bg-muted / text-foreground / text-muted-foreground / border-border`, `rounded-2xl`.
Logo: `components/Logo.tsx` (SVG); masters in `apps/web/public/` (`logo-symbol.svg`, `logo-horizontal.svg`, `icon.svg`).

**Hard copy rules (do NOT break):**
1. **Never say "AI"** in product/marketing copy — use "smart insights" etc. (Exceptions: legal privacy/terms + the AiGuidanceDisclaimer.)
2. **Universal audience** — no race/culture framing anywhere.
3. Genwel is **not FCA-regulated** — keep the "not regulated financial advice" disclaimers; never claim otherwise.

---

## TASK 1 — Fix Insights chart Y-axis (`000.00` bug)

**File:** `apps/web/components/dashboard/insights/SpendingTrendChart.tsx`
**Symptom:** the Y-axis ticks all render `000.00` instead of `£2k / £4k / £6k / £8k`.
**Cause:** line ~82 `tickFormatter={(v) => formatCurrency(v)}` — `formatCurrency` (`lib/budget-utils.ts`,
`Intl.NumberFormat` full currency) produces strings too wide for the `width={56}` axis, so ticks clip
to `000.00`. Bars render fine (`isAnimationActive={false}` is correctly set — keep it; see §"Gotchas").
**Fix:** use a compact axis formatter (what Revolut/Wise do), e.g.:
```ts
const compactGBP = (v: number) =>
  v >= 1000 ? `£${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `£${Math.round(v)}`;
// <YAxis ... tickFormatter={compactGBP} width={44} />
```
Verify on prod with the real account (Jul spending ≈ £7.7k, avg ≈ £8.3k): ticks should read `£0 / £2k / £4k / £6k / £8k`.

---

## TASK 2 — Capture a name at magic-link signup

**File:** `apps/web/auth.ts`, lines ~144-148 — magic-link user creation does `db.user.create({ data: { email } })`
with **no name**. OAuth users get a real name+photo; magic-link users get only email, so the avatar/display
falls back to email-derived initials (`lib/user-display.ts` → "ezeikelpemberton@gmail.com" → "Ezeikel" / "EZ").

**Goal:** let magic-link users have a real name. Recommended approach (pick one, keep it simple):
- **Option A (lowest friction):** after first magic-link sign-in, if `user.name` is null, show a one-field
  "What should we call you?" prompt on the dashboard (a small client component that PATCHes the name).
  Add a tiny server action `updateUserName(name)` guarded by `auth()`.
- **Option B:** add an optional name field to the sign-in form and thread it through the Resend flow.
  Harder (NextAuth's email provider doesn't carry extra fields cleanly) — Option A is preferred.

`lib/user-display.ts` already degrades gracefully, so this is polish, not a blocker. Keep the email-derived
fallback intact for users who skip it.

**After both tasks:** `cd apps/web && npx tsc --noEmit && pnpm build`, then commit
(`type(scope): message`, one-liner, **no Claude attribution** per repo convention) and push `main`
(auto-deploys via Vercel git pipeline — see §"Deploy gotchas").

---

## TASK 3 — Build the mobile app end-to-end (the big one)

Mirror the web product as a native app. The mobile app is a **client of the web API** (same pattern as
PTP / Chunky Crayon): it authenticates and reads/writes through `www.genwel.com/api/*`. No direct DB access.

### 3a. What already exists in `apps/mobile` (your foundation — do NOT rebuild)
- **Stack:** Expo SDK 56, RN 0.85, `expo-router` (file-based), **NativeWind 5** (Tailwind classes in RN),
  `zustand` session store, `react-native-svg`, `react-native-reanimated`, `sonner-native` (toasts),
  `@fortawesome/react-native-fontawesome`, Google/Apple/Facebook sign-in libs, `expo-secure-store`.
- **Auth is wired:** `app/index.tsx` (entry: hydrate session → signed-in home stub OR sign-in),
  `components/sign-in-buttons.tsx`, `app/magic-link.tsx`, `lib/session.ts` (persisted session, `useSession()`),
  `lib/api.ts` (`apiFetch<T>(path, {token})` → `API_BASE` = `EXPO_PUBLIC_API_URL` ?? `www.genwel.com`).
- **Config:** `app.config.ts` (splash/adaptive icon teal `#1a5a5a`), `eas.json` (dev/preview/production profiles),
  `metro.config.js`, NativeWind `global.css`.
- **Server-side mobile auth already exists** in web: `app/api/auth/mobile/{google,apple,facebook,magic-link,magic-link/verify,me}/route.ts`
  — these mint/verify a device JWT (`jose`) and return a bearer token. `apiFetch` sends it as `Authorization: Bearer`.

### 3b. THE KEY ARCHITECTURAL GAP — data API routes don't exist yet
The web dashboard reads data via **React Server Components + server actions**, NOT REST endpoints.
There are **no** `/api/accounts`, `/api/transactions`, `/api/subscriptions`, `/api/insights`, `/api/overview`
routes for a client to consume. **You must create JSON API routes** (bearer-authed, reusing the same
`lib/` logic the RSC/actions use) for the mobile app. Design principle: **share the data layer, don't
duplicate it** — the pure logic already lives in plain `lib/` modules:
- `lib/subscriptions.ts` → `buildSubscriptionReport(txns)` (just fixed — see history below)
- `lib/banking/fixable-problems.ts` → `detectFixableProblems({report, overBudget})`
- net-worth/accounts grouping + `effectiveCategory` logic (see `app/dashboard/page.tsx` and `lib/`)
- `lib/entitlements.ts` → `getEntitlementsForUser(userId)` (Pro gating — mobile must respect it too)

Recommended: add `app/api/mobile/*` (or reuse `/api/*`) route handlers that call these, authed via the
same bearer→userId mechanism as `auth/mobile/me`. Return the SAME shapes the web computes so the RN
screens are thin. **Pro-gate identically** (free = 2 banks, teaser Fixable Problem; Pro = everything).

> ⚠️ Do NOT import `"use server"` action files or Prisma-relation-returning functions into places that
> RSC-serialize — see the RSC serialization note in `MEMORY.md`. Keep API-route logic in plain `lib/` modules.

### 3c. Screens to build (mirror web, use the same 5-tab structure)
Native **floating glass tab bar** — port `titrra/apps/mobile/components/GlassTabBar.tsx` (BlurView +
`elevation.float`, teal active / muted inactive, `react-native-safe-area-context`). That repo is the
reference RN counterpart to genwel's web `MobileTabBar.tsx`. Five tabs (same as web mobile):

1. **Overview** — net worth hero (+ "this month" delta), cash/savings/credit split, grouped accounts
   with breakdown, subscriptions summary card, Fixable Problems, recent transactions, one insight.
2. **Accounts** — connections + accounts, connect bank (TrueLayer flow — opens web OAuth via `expo-web-browser`/deep link back), disconnect.
3. **Transactions** — list with merchant logos (reuse `/api/merchant-logo` proxy), category, effectiveCategory, on-demand sync.
4. **Subscriptions** — the report from `buildSubscriptionReport` (total, list, renewals, price-rise + duplicate flags).
5. **Ask Genwel** — streaming chat (the `/api/chat` route already exists + is Pro-gated + tool-calls over real data).
   Bump-Circle-style simple text chat; use SSE/streamed fetch in RN (or poll). Pro-gated.
Plus **Budgets** + **Insights** reachable from an account/more affordance (web puts them in the account modal).

### 3d. Design parity
- Reuse brand tokens as NativeWind theme (teal `#1a5a5a`, gold `#d4a03c`, cream `#faf9f7`).
- Logo: RN SVG component from the same master SVGs (`apps/web/public/logo-*.svg`).
- Charts: `victory-native` or `react-native-svg` (Recharts is web-only). Match the clean monthly-bars style.
- FontAwesome **Pro** via `@fortawesome/react-native-fontawesome` (token is shared across Chewy Bytes projects).

### 3e. Monetization (later in the mobile build, but plan for it)
- Mobile Pro = **RevenueCat** (App Store / Play), NOT Stripe. Entitlement still flows through the DB
  `subscriptions` table (provider-agnostic — `lib/entitlements.ts` reads it regardless of provider).
- Full Chewy Bytes RN→store→RevenueCat playbook is in `~/Development/CLAUDE.md` ("Playbook: new Android app").
  Package ids: `com.chewybytes.genwel.app` (+ `.dev` / `.internal` variants). Shared credentials table in
  `~/Development/Personal/CLAUDE.md`. Don't regenerate shared keys.
- EAS gotchas (Sentry auth token, Android Metaspace OOM, Skia, first-iOS interactive creds) are documented
  in `~/Development/CLAUDE.md` "EAS build gotchas" — read before first build.

### 3f. Suggested sequence
1. Data API routes (§3b) + verify each with the real prod user's bearer token.
2. Session/tab-bar shell (GlassTabBar) + Overview screen wired to `/api/.../overview`.
3. Accounts + bank-connect deep-link flow (this is the fiddly one — TrueLayer OAuth round-trip on device).
4. Transactions + Subscriptions + Insights.
5. Ask Genwel streaming chat.
6. RevenueCat + EAS builds + TestFlight/Play internal track.

---

## Repo conventions & gotchas (learned this session — don't relearn the hard way)

- **Commits:** `type(scope): message`, one-liner, **NO Claude attribution**. Commit/push only when the work is done & builds.
- **DB migrations:** never `prisma db push`. `cd packages/db && pnpm db:migrate` then `pnpm build`. Neon prod branch `br-hidden-violet-ahpayw2m`, dev `br-square-fire-ahs8zxcs`.
- **FontAwesome sizing (web):** size `<FontAwesomeIcon>` via the **`size` prop** (`size="xl"` etc.) or a font-size class — **never `h-/w-`** (FA forces `height:1em`, so `h-5 w-5` collapses to the parent's label font-size). Bit us this session.
- **Recharts:** bars/cells with entrance animation render EMPTY — always set `isAnimationActive={false}`. And Recharts `fill` can't parse CSS `var()`/lab() — inline hex.
- **Deploy:** push to `main` → Vercel git pipeline auto-deploys (this WORKS and is the correct path). Do NOT trust `vercel --prod` from the CLI — it hits a doubled-path bug (`apps/web/apps/web`) because the project root is `apps/web`; those show as spurious "Error" rows in `vercel ls`. Check the **git-triggered** deploys' state, not manual ones.
- **Vercel env CLI is flaky** for this project: Production-scoped `env add` can store empty, and Preview needs `env add <name> preview <gitbranch> --value ... --yes` (the `git_branch_required` quirk). Prefer the dashboard for env changes. `FONTAWESOME_NPM_AUTH_TOKEN` is a **shared token across all Chewy Bytes projects** — fine as-is.
- **Subscription detection** (`lib/subscriptions.ts`) was rewritten this session (commit `32e7a10`) & validated on real prod data (£6,367→£848/mo). It excludes personal Faster Payments (`VIA MOBILE`/`PYMT FP`/`To A/C` in the RAW description — NOT `aiCategory`, which is unreliable), loans/tax/council/mortgage/school/savings by keyword, collapses same-day split charges, and requires a REGULAR cadence (kills App Store/PayPal aggregators). **When you build the mobile Subscriptions screen, reuse this exact function — don't reimplement.** Prefer precision: a false subscription is worse than a missed one.
- **DEV flags (web, hard-guarded to non-prod):** `DEV_AUTH_USER_ID` (skip sign-in locally), `DEV_ENTITLEMENT=pro|free`. User id: `cmldrrr7u00001oj2aofnkcan` (prod) — note the prod user has NO `name` (magic-link) until Task 2 lands.
- **Local dev:** `apps/web` uses `next dev --turbopack` (correct — matches Titrra/Go Unbeaten). If Turbopack serves 404s/panics, `rm -rf .next` and restart; don't change the dev script.

---

## Definition of done
- Task 1 & 2: fixed, typecheck+build green, pushed, verified on live prod.
- Task 3: mobile app runs on iOS sim + Android emulator via Expo dev client, all 5 tabs render real data
  for the signed-in user (parity with web), Pro gating respected, bank-connect works on device, Ask Genwel
  streams. Then EAS builds → TestFlight + Play internal track. RevenueCat wired for Pro.

Ask the user before anything irreversible (store submissions, prod migrations, new standing config).
