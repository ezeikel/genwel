# Genwel Launch Audit — July 2026

_Generated 2026-07-10. Source: 5-area audit workflow (web MVP, mobile, deploy/infra, store readiness, AI wedge) + 12 adversarial blocker verifications + live checks (genwel.com deployed & reachable; prod DB ~empty). Supersedes docs/AUDIT-2026-06.md for launch planning._

> **Same-day change:** the waitlist was retired (going live directly). Waitlist-related findings below are struck/annotated where applicable.

## Honest state

Genwel is a genuinely functional web app skeleton with a near-empty mobile shell, a well-scaffolded-but-unbuilt AI wedge, and zero production deployment config. WEB (~70%): the full authenticated loop works end-to-end — magic-link + Google/Apple/Facebook OAuth, TrueLayer connect (sandbox only), transaction sync, Gemini categorization, GPT budget suggestions/insights, budgets CRUD. What blocks web launch is almost entirely non-technical/compliance: legal pages (/terms, /privacy, /cookies) don't exist yet but are linked from SignInForm.tsx and Footer.tsx (404s), the app falsely claims "FCA Registered"/"FCA regulated" (LaunchFooter.tsx:100, EmptyState.tsx:82) with no FRN, there's no cookie consent, no financial-advice disclaimer on AI output, TrueLayer is still on sandbox (only Mock Bank), and no production env is configured on Vercel. MOBILE (~10%): apps/mobile is auth-only — only /index and /magic-link screens exist, no (tabs) navigation, no product screens, and critically NO product REST API routes exist on the web backend (dashboard reads Prisma directly via server components), so there is nothing for mobile to call. It cannot be submitted: ascAppId is still "TODO_ASC_APP_ID" in eas.json:81, no google-service-account.json, no store listings, no account-deletion endpoint, no RevenueCat. AI WEDGE (~5%): categorization/suggestions/insights work, but the entire Ask Genwel differentiator (agent core, tool registry, dup-subscription detection, biggest-fixable-problems, conversation persistence, chat UI, guards) is unbuilt and @ai-sdk/anthropic isn't even installed. Note: the waitlist blocker is now moot — uncommitted working-tree changes retire the waitlist page and redirect to /signin, so no waitlist DB model or /api/waitlist route is needed (verification confirmed is_real=false). Bottom line: web is ~1–2 weeks of compliance + deploy work from a credible MVP; the founder-mandated AI wedge is ~4–6 weeks; mobile store launch is a from-scratch build of both the product surface AND the backing API, realistically 6–10+ weeks out.

## Critical path (highest-leverage sequence)

1. Ship the compliance triad for web: create /terms, /privacy, /cookies pages; add a cookie-consent banner; add AI financial-advice disclaimers on InsightCard/AiSuggestionButton. (Unblocks legal web launch.)
1. Remove the false 'FCA Registered'/'FCA regulated' claims (LaunchFooter.tsx:100, EmptyState.tsx:82) and fix all Footer.tsx dead '#' links; commit the working-tree waitlist retirement + repoint header/hero CTAs to /signin.
1. Add missing OAuth/Apple/Facebook/EMAIL_FROM vars (see list) to apps/web/.env.example so nobody is guessing what prod needs.
1. Configure the full production env on Vercel (project prj_52hqFGSXMpZwr7woSe8ddRLNYaHs) with DATABASE_URL → Neon prod branch br-hidden-violet-ahpayw2m; confirm auto-deploy + a passing strict-TS build.
1. Complete TrueLayer production onboarding, add live creds, flip NEXT_PUBLIC_TRUELAYER_ENV='production', and run a real-bank end-to-end smoke test on the deployed site. → WEB MVP IS LIVE.
1. Build the wedge's cheapest high-value piece: findDuplicateSubscriptions + getBiggestFixableProblems as heuristics over Transaction rows, surfaced as a 'Fixable Problems' card on the existing dashboard (no agent/chat needed). → Delivers the differentiator without gating launch.
1. Add dashboard error boundary + rate limiting on sync/auth + wire PostHog funnel events (hardening for real traffic and AI-cost control).
1. Build the mobile-enabling backend: token-auth REST routes (/api/banking/accounts, /api/transactions, /api/budgets*, /api/insights*) and the account-deletion endpoint — required for BOTH mobile and Apple review.
1. Build the mobile product surface on top of those routes ((tabs) nav, screens, API hooks, TrueLayer connect flow, settings/delete) — the actual app.
1. Then (in parallel with #8–9) build the full Ask Genwel agent + chat UI (add @ai-sdk/anthropic, agent core, tool registry, guards, AskConversation/AskMessage models, /api/ask-genwel routes, chat component) as the fast-follow that turns the dashboard card into a conversational advisor; create store records (ascAppId, Play service account), assets, privacy declarations, demo account, and submit.

## Web launch path

1. Create legal pages: apps/web/app/terms/page.tsx, apps/web/app/privacy/page.tsx, apps/web/app/cookies/page.tsx with real UK-compliant text (financial data handling, TrueLayer/Open Banking flow, GDPR, retention). Fixes the 404s linked from SignInForm.tsx:196-202 and Footer.tsx. BLOCKER.
1. Remove or substantiate FCA claims: delete/correct 'FCA Registered' in components/launch/LaunchFooter.tsx:100-101 and 'FCA regulated' in components/dashboard/EmptyState.tsx:82. If not actually FCA-authorised, remove entirely — false regulatory claims are a legal/FCA-perimeter risk. BLOCKER.
1. Add a financial-advice disclaimer to all AI output surfaces (AiSuggestionButton.tsx, InsightCard.tsx) — 'AI-generated, not regulated financial advice, for guidance only'. The generators (lib/ai/budget-suggestions.ts, lib/ai/insights.ts) literally label themselves 'financial advice'. BLOCKER.
1. Add a cookie consent banner and wire Plausible/PostHog to fire only post-consent (no consent component exists anywhere today). BLOCKER for UK/EU.
1. Fix Footer.tsx dead links: point Privacy/Terms/Cookie to the new pages; remove or implement About/Careers/Contact/social '#' links; add id='roadmap' to RoadmapSection.tsx or drop the anchor.
1. Fix Header 'Join Waitlist' CTA (Header.tsx) — waitlist is being retired in the working tree, so repoint the header/hero CTAs to /signin (matches the in-progress next.config.ts redirect). Commit the uncommitted working-tree cleanup that removes apps/web/app/waitlist/page.tsx.
1. Add apps/web/app/dashboard/error.tsx error boundary so an uncaught render error doesn't white-screen the dashboard.
1. Switch TrueLayer to production: obtain live client_id/secret, complete TrueLayer production onboarding/approval, set NEXT_PUBLIC_TRUELAYER_ENV='production' + prod redirect URI (lib/truelayer/client.ts). Users can only see Mock Bank until this lands. HIGH.
1. Configure the full production env on Vercel for project prj_52hqFGSXMpZwr7woSe8ddRLNYaHs (all vars incl. the undocumented OAuth/Apple/Facebook set — see missing_env_vars), pointing DATABASE_URL at the Neon production branch br-hidden-violet-ahpayw2m. BLOCKER.
1. Confirm Vercel Git auto-deploy is enabled for apps/web (repo root is NOT the Vercel root); verify build passes with TS strict now that ignoreBuildErrors was removed. Do a real end-to-end prod smoke test: sign in with a live provider, connect a real bank, sync, see categorized txns + a budget.
1. (Recommended pre-real-users) Add rate limiting to /api/banking/sync and auth endpoints (Upstash) to cap DOS/AI-cost runaway; wire PostHog capture() on the core funnel (signin→connect→budget) which is currently configured but emits no events.

## App-store launch path (iOS + Android)

1. PREREQUISITE — build the backend product API layer first. Today the web dashboard reads Prisma directly in server components; NO REST routes exist for mobile. Create token-authenticated routes reading via getCurrentUserFromToken(): GET /api/banking/accounts, GET /api/transactions (paginated: limit/offset/accountId/category/from/to), GET+POST+PATCH+DELETE /api/budgets(+/[id]) and /api/budget-progress, GET /api/insights + PATCH /api/insights/[id]. Port existing actions/budgets.ts getBudgetProgress logic. BLOCKER for both stores.
1. Build the mobile product surface: add apps/mobile/app/(tabs)/_layout.tsx + home/accounts/transactions/budgets/insights screens, an auth guard hook redirecting unsigned users to /index, a typed API client + hooks in lib/api.ts (useAccounts/useTransactions/useBudgets/useInsights), EmptyState/loading/error states, and pull-to-refresh. None exist today.
1. Implement the mobile bank-connect flow: tap Connect → expo-web-browser to TrueLayer OAuth → redirect to genwel://banking/callback → store connection. Fix the callback to derive userId from the authenticated session, not unsigned state (CSRF).
1. Add the account-deletion path (Apple hard requirement): DELETE /api/auth/delete-account (verify session, Prisma cascade-delete User→connections/accounts/transactions/insights, clear session) + a Settings screen with Delete Account, and a public deletion URL for App Store Connect.
1. Create the store records: iOS app in App Store Connect (bundle com.chewybytes.genwel.app, team HGX827L49J) → put the 9-digit ascAppId into eas.json:81 (currently 'TODO_ASC_APP_ID'); Google Play app + service-account JSON at apps/mobile/google-service-account.json (referenced eas.json:75 but missing), gitignored.
1. Complete store privacy/data-safety: link the new /privacy URL; declare financial data / user ID / device ID in Apple App Privacy and Google Data Safety (finance apps get max scrutiny — incomplete = instant rejection). Deploy https://genwel.com/.well-known/assetlinks.json for Android App Links, and add iOS Face ID usage strings (NSFaceIDUsageDescription).
1. Create a review demo account: production Genwel account with TrueLayer mock bank (john/doe), 30+ days of txns, and a configured budget; put credentials in review notes.
1. Produce store assets/listing: 2–5 screenshots per platform, feature graphic, app name/subtitle/description/keywords, Finance category, age rating, support + developer contact.
1. Monetization decision then RevenueCat (only if paid): install react-native-purchases, create genwel-pro entitlement + iOS/Play products, build paywall. Skip if launching free.
1. Move token storage to secure storage (SecureStore is present; ensure TrueLayer tokens are never plaintext/AsyncStorage), add @sentry/react-native, then TestFlight/internal-track beta before full submit.
1. Build production, submit iOS via eas submit (needs ascAppId) and Android AAB via Play Console/google-play-cli with phased rollout.

## AI wedge gap

The founder is holding launch for Ask Genwel (voice+text advisor chat), duplicate-subscription detection, and a ranked biggest-fixable-problems feed — and essentially NONE of it exists. Everything is spec-only in docs/ASK-GENWEL-PLAN.md. Concretely still to build: (a) add @ai-sdk/anthropic (not in apps/web/package.json today — only google+openai) + ANTHROPIC_API_KEY; (b) agent core lib/agents/advisor.ts (streamText, stopWhen: stepCountIs(6), Claude Sonnet primary + Gemini fallback via createFallback); (c) 6-tool registry lib/agents/tools/ each with Zod schema + toModelOutput; (d) the two wedge tools specifically — findDuplicateSubscriptions (pure heuristic over Transaction rows via lib/banking/merchant.ts normalization; recurring same-ish amount/cadence, confidence tier) and getBiggestFixableProblems (composite ranking with £ savings); (e) tool-guards (RequireConnectedBank, input/output validators stripping account numbers/tokens, fail-open Gemini safety classifier); (f) Prisma models AskConversation/AskMessage + migration; (g) route handlers /api/ask-genwel/authorize + /chat + messages; (h) context.ts financial-snapshot system prompt with Anthropic cache-control; (i) shadcn chat UI in components/ask-genwel/ (useChat, markdown+DOMPurify, InsightCard rendering). VOICE (Cloudflare Worker+DO, Deepgram, ElevenLabs) is a large separate stream. Realistic effort: ~4–6 weeks for text-only wedge, more with voice. RECOMMENDATION: Do NOT gate the whole launch on the full wedge. The dup-subscription detector is the true differentiator and is the CHEAPEST piece — it's a pure heuristic needing no agent, no chat UI, no Anthropic key. Ship the working loop to web NOW behind the compliance fixes, land findDuplicateSubscriptions + getBiggestFixableProblems as a simple 'Fixable Problems' card on the existing dashboard (reuses insights UI), and treat the full conversational Ask Genwel chat + voice as a fast-follow. This delivers the 'not just another budget tracker' wedge in ~1 week instead of blocking launch for 6, and lets real users/data validate the agent before you build it.

## Missing env vars (deployment landmines)

- `APPLE_CLIENT_ID` — (used in auth.ts + app/api/auth/mobile/apple, absent from .env.example)
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`
- `APPLE_BUNDLE_IDS` — (JWT audience validation for mobile Apple sign-in; blocks mobile auth in prod)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CONSUMER_APP_ID`
- `FACEBOOK_CONSUMER_APP_SECRET`
- `EMAIL_FROM` — (referenced in code alongside DEFAULT_FROM_EMAIL — only DEFAULT_FROM_EMAIL is documented; reconcile/consolidate)
- `ANTHROPIC_API_KEY` — (required for Ask Genwel agent; @ai-sdk/anthropic also not installed)
- `DEEPGRAM_API_KEY` — (Ask Genwel voice path — future)
- `ELEVENLABS_API_KEY` — (Ask Genwel voice path — future)
- `EXPO_PUBLIC_API_URL` — / EXPO_PUBLIC_APP_URL (mobile → backend endpoint; document per eas.json build profile)

Also: `lib/auth-mobile.ts` uses `NEXT_AUTH_SECRET` while `auth.ts` uses `NEXTAUTH_SECRET` — mobile auth throws in prod unless BOTH are set (or the naming is consolidated). Mobile magic-link uses `EMAIL_FROM` vs web's `DEFAULT_FROM_EMAIL`.

## Open decisions

### Is Genwel actually FCA-authorised (or operating under an appointed-representative/agent arrangement), or not regulated at all?
_The app currently claims 'FCA Registered'/'FCA regulated' with no FRN. If not authorised, these must be removed and AI output must be framed as guidance, not advice — this materially changes copy and disclaimers site-wide and is a hard web-launch gate._

- Not regulated — strip all FCA claims, add 'not financial advice' disclaimers, launch as a budgeting/information tool
- Authorised/AR — surface the real FRN and keep claims (requires proof)
- Defer AI advice features until authorisation is obtained

### Do we still gate the public launch on the FULL Ask Genwel conversational wedge (chat + voice), or ship the working loop + a dup-subscription/fixable-problems card now and fast-follow the chat?
_The full agent+voice is ~4–6+ weeks; the dup-sub heuristic is ~1 week and is the real differentiator. This is the single biggest schedule lever and reverses the earlier hold-for-wedge decision._

- Hold launch until full Ask Genwel chat ships (original plan, ~6 wks)
- Ship web loop + Fixable-Problems card now, chat as fast-follow (recommended)
- Ship loop now, wedge later with no interim differentiator

### Is Genwel free at launch, or paid (Genwel Pro ~£4.99–6.99/mo)?
_Determines whether RevenueCat + paywall + store IAP products are on the mobile critical path or can be skipped entirely; also affects store review scope._

- Free at launch — skip RevenueCat, fastest to store
- Paid/freemium — build RevenueCat + paywall before mobile submit
- Free web, paid mobile later

### Text-only Ask Genwel for v1, or voice+text from the start?
_Voice requires porting Swap's Cloudflare Worker+DO with Deepgram+ElevenLabs — a large separate workstream that roughly doubles wedge effort._

- Text-only v1, voice as a later phase (recommended)
- Voice+text together (bigger scope, delays launch)

### Web-only public launch first, or web + mobile stores together?
_Mobile requires building both the product screens AND a backend REST API that doesn't exist yet (~6–10 wks), plus store setup. Coupling them delays the web MVP that is nearly ready._

- Launch web now, mobile as a separate later milestone (recommended)
- Hold web to launch alongside mobile stores
- Web now + TestFlight/internal beta for mobile in parallel

---

## Appendix A — Area audits (done vs remaining)

### Genwel Web App MVP Launch Readiness
The Genwel web app is approximately 70% ready for MVP launch. All core features work end-to-end: authentication (magic link + Google/Apple/Facebook OAuth), TrueLayer bank connection (sandbox mode), transaction sync with AI categorization, budget creation/tracking, and AI-powered insights. Code quality is high with well-organized architecture. However, critical compliance gaps block public launch: legal pages (Terms/Privacy) are dead links, waitlist form is non-functional, no FCA disclaimers, and TrueLayer is sandbox-only. These are regulatory/legal issues, not technical.

**Done:**
- ✅ Sign-in flow: Magic link (Resend) + Google/Apple/Facebook OAuth fully working with proper error pages
- ✅ Dashboard home: Displays connected accounts, balances, recent transactions, budget status
- ✅ Bank connection: TrueLayer OAuth integration complete with callback sync and background categorization
- ✅ Accounts page: Shows all connected banks with balances, types, currencies
- ✅ Transactions page: Last 30 days with category-based spending chart and full transaction list
- ✅ Budgets page: Create/edit/view with period selector (calendar month vs payday), category allocation, progress bars
- ✅ AI categorization: Gemini-3-flash batch processing (20 tx/batch) with merchant key caching and bounded incremental processing
- ✅ AI budget suggestions: GPT-5.2 model generating recommendations based on 3-month spending history
- ✅ AI insights: GPT-5.2 generating personalized spending analysis comparing current vs previous period with 48h expiry
- ✅ Empty states: Present across accounts, transactions, budgets, insights with contextual CTAs
- ✅ Database schema: Complete (users, bank_connections, bank_accounts, transactions, budgets, ai_insights) with proper indexes and cascading
- ✅ Email authentication: Resend configured with React Email templates for magic links
- ✅ OAuth providers: Conditional enable based on environment variables (good for development)
- ✅ Server actions: Complete set (connectBank, disconnectBank, getBudgetConfig, setBudgets, getBudgetProgress, categorizeTransactions, getAiBudgetSuggestions, generateInsights)
- ✅ Infrastructure: Vercel linked, PostgreSQL Neon pooler configured, Sentry/PostHog/Sanity integrated
- ✅ Session management: NextAuth.js 5 with PrismaAdapter, database strategy, 30-day maxAge
- ✅ Transaction sync: Background sync on bank connect with automatic categorization via background jobs (after() API)
- ✅ Error handling: Proper auth error pages with tailored messages (expired link, OAuth misconfiguration, etc.)
- ✅ Code organization: Well-structured with /actions, /lib (split by domain), /components (feature-based), /app (route-based)
- ✅ Performance: Server-side rendering where appropriate, incremental AI processing (non-blocking), 6-second refresh delay acceptable for MVP

**Remaining:**
- 🔴 **Create legal pages (Terms, Privacy, Cookies)** (blocks: web)  
  /Users/ezeikel/Development/Personal/genwel/apps/web/app/signin/SignInForm.tsx lines 196-202 link to /terms and /privacy which do NOT exist (will 404). Need to create: apps/web/app/privacy/page.tsx, apps/web/app/terms/page.tsx, apps/web/app/cookies/page.tsx with actual legal text. This is a regulatory blocker - users must be able to agree to ToS before signup.
- 🟠 **Implement waitlist form submission (/api/waitlist)** (blocks: web)  
  /Users/ezeikel/Development/Personal/genwel/apps/web/components/HeroSection.tsx line 23 and Footer.tsx line 22 both have TODO comments: 'TODO(phase-3): POST to /api/waitlist + emit posthog waitlist_signup'. Forms exist but don't submit. Need to create: apps/web/app/api/waitlist/route.ts (POST endpoint with email validation), apps/web/actions/waitlist.ts, update HeroSection and Footer to call the endpoint, emit PostHog event. Marketing funnel is broken without this.
- 🔴 **Add FCA/financial service disclaimers** (blocks: web)  
  App generates financial advice (AI budget suggestions, spending insights) but displays no regulatory disclaimers. No FCA regulated statement anywhere (EmptyState claims it falsely). Missing: financial advice disclaimer, data protection notice, UK regulatory compliance statement, GDPR messaging. Need cookie banner, updated privacy policy with financial data handling. Systemic across /components and /app. Legal exposure if gone live without these.
- 🟠 **Fix footer links** (blocks: web)  
  /Users/ezeikel/Development/Personal/genwel/apps/web/components/Footer.tsx has dead links: About (#), Careers (#), Contact (#), Privacy Policy (#), Terms of Service (#), Cookie Policy (#), plus 4 social media links (#). Either implement real pages or remove from navigation. Currently looks unprofessional and breaks user expectations.
- 🟠 **Switch TrueLayer from sandbox to production** (blocks: web)  
  /Users/ezeikel/Development/Personal/genwel/apps/web/.env.local line 16: NEXT_PUBLIC_TRUELAYER_ENV='sandbox'. Users will only see Mock Bank (not real NatWest/Barclays). For public launch: change to 'production', verify TrueLayer production credentials work, test real bank connection end-to-end. Cannot accept real users on sandbox.
- 🟡 **Add error boundaries to dashboard** (blocks: web)  
  /Users/ezeikel/Development/Personal/genwel/apps/web/app/dashboard/* pages lack error.tsx. Any uncaught error crashes page (white screen). Create apps/web/app/dashboard/error.tsx and wrap layout in proper error boundary. Medium severity for MVP if monitoring is good, but should fix before real users.
- 🟠 **Implement waitlist database model** (blocks: neither)  
  No waitlist/signup table in schema. Need to add Prisma model or use Sanity. When /api/waitlist receives email, where does it store? Recommend: add WaitlistSignup model to packages/db/prisma/schema.prisma with email, createdAt, status fields.
- 🟡 **Add rate limiting to auth and sync endpoints** (blocks: web)  
  /Users/ezeikel/Development/Personal/genwel/app/api/banking/sync and /api/auth/* endpoints can be called infinitely by authenticated users. No rate limiting. Risk: DOS attack, runaway AI costs. Implement middleware-based rate limiting (e.g., Upstash Redis).
- 🟡 **Enable analytics event tracking** (blocks: web)  
  PostHog configured (phc_luvBANXvIsDaZFZQQQxxqWGfxp1gLrHmli7hYV4aXNX) but not integrated. No events emitted. Cannot track funnels (sign-in > bank connect > budget create). Add posthog.capture() calls to key flows in server actions and client components.
- 🟡 **Fix header 'Join Waitlist' button** (blocks: web)  
  /Users/ezeikel/Development/Personal/genwel/apps/web/components/Header.tsx line 52-54: Button renders but has no href or onClick. Should either link to /waitlist or open signup modal.
- 🔵 **Add loading/skeleton states to dashboard** (blocks: neither)  
  Dashboard loads then flashes empty state for 6 seconds (SyncTrigger waits for background sync). Users see jarring UI transition. Add Suspense boundaries and skeleton loaders (e.g., react-loading-skeleton) to balance cards, transaction list, budget section. Low priority but improves perceived performance.
- 🟡 **Review and cap AI model costs** (blocks: neither)  
  Every transaction sync calls Gemini Flash (free tier but expensive at scale), budget suggestions use GPT-5.2 (expensive), insights use GPT-5.2. No rate limiting or cost caps. As user base grows, OpenAI/Google bills will explode. Implement: cost budgets, cached suggestion TTL, batch processing during off-peak hours.
- 🔵 **Configure production Sentry alerts** (blocks: neither)  
  Sentry configured but no alerts. Should alert on: 500 errors, failed bank syncs, AI categorization failures, payment issues (if added). Create alerts in Sentry dashboard for production environment.

### Genwel Mobile App (Expo SDK 56) — Readiness Audit
The mobile app is auth-only and entirely unshippable. It has functional sign-in (Apple/Google/Facebook/magic-link) backed by solid mobile auth routes on the web backend, but contains zero product screens. Beyond authentication, the app is a skeleton: it lacks the entire authenticated product surface (dashboard, accounts, transactions, budgets, banking connect, AI insights), all product APIs, navigation structure, RevenueCat/paywall, push notifications, and web backend integrations. The app cannot be submitted to app stores.

**Done:**
- ✅ Expo SDK 56, React Native 0.85, NativeWind 5 preview, expo-router configured correctly
- ✅ Build configuration (app.config.ts) with dev/preview/production variants, bundle IDs, icon/splash setup
- ✅ EAS build/submit profiles for all three environments (development/preview/production)
- ✅ Session state management (Zustand store in lib/session.ts) with SecureStore persistence
- ✅ Complete OAuth2 sign-in (Apple with jose JWKS verification, Google with OAuth2Client, Facebook with debug_token validation, magic-link via Resend)
- ✅ Mobile auth backend routes fully implemented and working (/api/auth/mobile/apple, /google, /facebook, /magic-link, /magic-link/verify, /me)
- ✅ Entry screen with sign-in button component (OAuth + email)
- ✅ Magic-link deep-linking (genwel:// URL scheme configured)
- ✅ Global CSS with Tailwind/NativeWind theme (design tokens, color palette, fonts)
- ✅ Toast notifications (sonner-native)
- ✅ Type-safe routing (expo-router with typedRoutes experiment enabled)
- ✅ Safe area + gesture handler providers
- ✅ CORS headers on mobile auth endpoints
- ✅ Session token scoped to 7 days, magic-link token to 15 minutes

**Remaining:**
- 🔴 **Create product navigation structure (home, accounts, transactions, budgets, insights tabs or stack)** (blocks: both)  
  Currently only /index and /magic-link screens exist in apps/mobile/app. Need full routing hierarchy: /dashboard (or /(tabs)) with Tab.Screen for Accounts, Transactions, Budgets, Insights. The web app shows the full product surface (see apps/web/app/dashboard/: accounts/page.tsx, transactions/page.tsx, budgets/page.tsx, insights/page.tsx). Mobile needs equivalent screens. Use expo-router tabs + stack for modals. File paths: apps/mobile/app/(tabs)/_layout.tsx, apps/mobile/app/(tabs)/accounts.tsx, etc.
- 🔴 **Build product API client layer for mobile (fetch wrappers for accounts, transactions, budgets, banking, insights)** (blocks: both)  
  apps/mobile/lib/api.ts exists but is minimal (just apiFetch). Need: getAccounts(), getTransactions(accountId, filters), getBudgets(), createBudget(), updateBudget(), deleteCategory(), getBankConnections(), syncBankAccount(), getInsights(). The web backend has NO product API routes currently—only auth routes (/api/auth/mobile/*). Must create /api/banking/accounts, /api/transactions, /api/budgets/*, /api/insights/* routes on apps/web/app/api/ that read from Prisma DB (user bankAccounts, transactions, budgets, aiInsights models all exist in packages/db/prisma/schema.prisma). Each route must check Authorization header (Bearer token) via getCurrentUserFromToken() or similar.
- 🔴 **Implement Accounts screen (list bank connections, connect new bank via TrueLayer)** (blocks: both)  
  apps/mobile/app/(tabs)/accounts.tsx needs to: (1) GET /api/banking/accounts (list BankConnections + BankAccounts), (2) show ui for tapping to connect new bank (deep link to web /api/banking/auth or mobile-native flow), (3) display account type/balance/provider. Web backend has TrueLayer integration at apps/web/lib/truelayer/client.ts and apps/web/app/api/banking/callback for OAuth redirect, but mobile needs its own entry point. Consider: (a) open web auth in browser (oauth-in-webview), (b) implement TrueLayer native SDK for mobile (if available), (c) proxy through web with callback deep-linking back to app. The web app (AccountsPage) queries db.bankConnection.findMany with user auth; mobile needs equivalent.
- 🔴 **Implement Transactions screen (paginated list, filtering, search)** (blocks: both)  
  apps/mobile/app/(tabs)/transactions.tsx needs to: (1) GET /api/transactions (paginated, filtered by accountId/category/date range), (2) display transaction list with amount/merchant/category/timestamp, (3) support pull-to-refresh, (4) optional search/filter UI. Web app (TransactionsPage) queries db.transaction.findMany() scoped to user. Mobile needs API route that parses query params (limit, offset, accountId, category, from, to) and returns paginated results with proper timestamps.
- 🔴 **Implement Budgets screen (CRUD budgets by category)** (blocks: both)  
  apps/mobile/app/(tabs)/budgets.tsx needs to: (1) GET /api/budgets (list all budgets for user), (2) GET /api/budget-progress (summary + % spent per category), (3) navigate to /budgets/[id] for edit or /budgets/create, (4) POST /api/budgets (create), PATCH /api/budgets/[id] (update), DELETE /api/budgets/[id]. Web app has BudgetConfig + Budget models with SpendingCategory enum. Mobile needs these CRUD routes and calculations (spent vs budget per category, visual progress bars). The web getBudgetProgress() function exists (apps/web/app/actions/budgets.ts)—could be ported or called as an API.
- 🔴 **Implement Insights screen (AI-generated insights, spending trends, anomalies)** (blocks: both)  
  apps/mobile/app/(tabs)/insights.tsx needs to: (1) GET /api/insights (list AiInsight records for user), (2) show cards for each insight type (spending_trend, anomaly, saving_tip, budget_suggestion), (3) mark as read on tap. Web backend has ai/insights.ts generators + AiInsight model (type, title, body, read, expiresAt fields). Mobile needs /api/insights route that GETs insights.findMany(where: {userId}) and PATCH /api/insights/[id] {read: true}.
- 🟠 **Add authentication guard to all product routes (redirect to /index if no session)** (blocks: both)  
  Currently only /index checks hydrated/user state. Need a useProtected() hook or middleware that wraps /dashboard/* routes to redirect unsigned users to /index. expo-router doesn't have native middleware, so use a HOC or useEffect in each screen that calls useSession() and routes.replace('/') if !user.
- 🔴 **Create web backend API routes for product data (/api/banking/accounts, /api/transactions, /api/budgets/*, /api/insights/*)** (blocks: both)  
  Currently only auth mobile routes exist. Must add: (1) GET /api/banking/accounts (list BankConnections + nested BankAccounts), (2) GET /api/transactions?limit=20&offset=0&accountId=x&category=y&from=2024-01-01&to=2024-12-31 (paginated, scoped to user), (3) GET /api/budgets, PATCH /api/budgets/[id], POST /api/budgets, DELETE /api/budgets/[id] (BudgetConfig + Budget CRUD), (4) GET /api/insights (AiInsight list), PATCH /api/insights/[id] (mark read). Each route: extract userId from JWT token (getCurrentUserFromToken()), check authorization, query Prisma, return JSON. Files: apps/web/app/api/banking/accounts/route.ts (new), apps/web/app/api/transactions/route.ts (new), apps/web/app/api/budgets/route.ts (new), apps/web/app/api/budgets/[id]/route.ts (new), apps/web/app/api/insights/route.ts (new), apps/web/app/api/insights/[id]/route.ts (new).
- 🟠 **Add type-safe API client hooks for mobile (useAccounts, useTransactions, usebudgets, useInsights with loading/error states)** (blocks: app-store)  
  apps/mobile/lib/api.ts should export custom hooks or utility functions that wrap apiFetch with proper typing, error handling, caching (react-query or simple store). Example: export function useAccounts() { const token = useSession(s => s.token); const [data, setData] = useState(null); useEffect(() => { apiFetch('/api/banking/accounts', {token}).then(setData).catch(...); }, [token]); return data; }. Better: use zustand stores per feature or TanStack Query for caching.
- 🟠 **Implement bottom-sheet/modal navigation for actions (connect bank, create budget, edit transaction category)** (blocks: app-store)  
  Expo doesn't have built-in modals like web. Use react-native-bottom-sheet or expo's built-in modal + expo-router linking. Each product screen should have UI for modals: ConnectBankModal, CreateBudgetModal, EditTransactionModal. Wire them to POST routes (e.g., POST /api/budgets, POST /api/banking/connect).
- 🟡 **Set up RevenueCat SDK for paywall/subscription management (if premium features planned)** (blocks: app-store)  
  Mobile app has no RevenueCat integration. apps/mobile/providers.tsx comment says 'Add RevenueCat / paywall as those land'. Install: pnpm add react-native-purchases-ui. Create RevenueCat SDK initialization in providers, fetch offerings, present paywall on specific triggers (e.g., budget creation limit or premium insights). No web-side pricing/subscription logic exists yet, so this depends on product roadmap. If free-forever, skip; if subscription SaaS, blocker.
- 🟡 **Set up push notifications (expo-notifications + web backend for notification triggers)** (blocks: neither)  
  No push infrastructure. Install: pnpm add expo-notifications. Create: (1) notification permission request on app launch (expo-notifications.requestPermissionsAsync), (2) store Expo Push Token in Genwel DB (new PushToken model or add to User), (3) backend jobs/crons to send insights/alerts (e.g., daily spending summary, budget exceeded). Web needs /api/notifications/send route to dispatch via Expo Notifications API. Without this, app has no engagement mechanism.
- 🟠 **Add error boundaries and offline handling for product screens** (blocks: app-store)  
  No error boundary components exist. Add React Error Boundary wrapper to /dashboard layout. Handle network failures gracefully (retry logic, cached fallback data, toast errors). Install: expo-network for network detection, implement retry wrapper on apiFetch.
- 🟡 **Implement pull-to-refresh on transaction/account lists** (blocks: app-store)  
  React Native FlatList or react-native-gesture-handler's pull-to-refresh. Wrap product list screens with refreshControl (Android) or custom swipe gesture (iOS). Add refresh handler to query the API and update state.
- 🟡 **Set up analytics tracking for mobile (PostHog mobile SDK or custom events)** (blocks: neither)  
  Web app uses PostHog server/client. Mobile app has no tracking. Install: pnpm add posthog-react-native. Initialize in providers, track screen views + key events (sign-in, account-connect, budget-create, etc.). Mirror web analytics schema so product team can unify metrics.
- 🟠 **Configure environment variables for mobile API endpoint, auth secrets, and provider IDs** (blocks: both)  
  app.config.ts already reads EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_FACEBOOK_APP_ID, EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN. Need to add: EXPO_PUBLIC_API_URL (dev/preview override), EXPO_PUBLIC_APP_URL (production default: www.genwel.com). lib/api.ts already handles API_BASE from EXPO_PUBLIC_API_URL, so this should work. Ensure eas.json build profiles set EXPO_PUBLIC_ENVIRONMENT per variant. Check: run eas build --profile production --dry-run to validate.
- 🟠 **Fill ASC App ID in eas.json for iOS App Store submission** (blocks: app-store)  
  eas.json has ascAppId: TODO_ASC_APP_ID. Must create app record in Apple App Store Connect (appstoreconnect.apple.com) under team HGX827L49J (already in config), get numeric App ID, add to eas.json submit.production.ios.ascAppId. Without this, eas submit --profile production will fail.
- 🟠 **Create Google Play Store app entry and generate signing key for Android submission** (blocks: app-store)  
  eas.json has Android submission but no serviceAccountKeyPath configured. Follow: Create app entry in Google Play Console, enable API access, download service account JSON, add path to eas.json submit.production.android. Also ensure google-service-account.json exists at repo root for Gradle to find signing config.
- 🟠 **Design and implement mobile-specific banking connection flow (TrueLayer OAuth in webview or native flow)** (blocks: both)  
  Web banking flow opens OAuth in browser (/api/banking/callback redirects back to www.genwel.com/dashboard/accounts). Mobile needs seamless deep-linking: (a) tap 'Connect Bank' -> open auth in in-app webview (expo-web-browser) -> TrueLayer OAuth -> redirect to genwel://banking/callback -> parse and store connection. Or (b) implement TrueLayer native SDK if available. File: apps/mobile/app/(tabs)/accounts/(modals)/connect-bank.tsx or similar.
- 🟡 **Create placeholder/loading states and empty states for all product screens** (blocks: app-store)  
  Entry screen shows ActivityIndicator while hydrating. All product screens need: ActivityIndicator during fetch, EmptyState component when no data, error states with retry button. Web app has EmptyState component (apps/web/components/dashboard/EmptyState.tsx)—create React Native equivalent at apps/mobile/components/EmptyState.tsx.
- 🟠 **Test mobile auth flow end-to-end (sign-in, session persistence, logout, magic-link deep-linking)** (blocks: app-store)  
  No test suite. Manual QA: (1) test sign-in with each provider (Apple/Google/Facebook) on iOS/Android, (2) verify session persists across app restart (check SecureStore), (3) test magic-link email -> genwel://magic-link?token=… deep-link, (4) test logout clears token, (5) test expired token redirects to sign-in. Add automated E2E tests using Detox or similar (optional but recommended for pre-launch).
- 🟠 **Implement App Store-compliant privacy policy, GDPR consent, and data deletion flow** (blocks: app-store)  
  App submission requires privacy policy URL, GDPR consent for EU users, and deletable data. Mobile app sends email to Apple ID / provider (implicitly), stores session token in SecureStore. Need: (1) privacy policy link in app (settings screen or web), (2) in-app GDPR consent banner, (3) POST /api/users/delete-account route that wipes user data (Cascading deletes via Prisma: User -> cascades to BankConnections, Budgets, Transactions, AiInsights). Files: apps/mobile/app/(tabs)/settings.tsx, apps/web/app/api/users/delete-account/route.ts.
- 🟡 **Create onboarding / welcome screens for first-time users (budget setup wizard)** (blocks: app-store)  
  Currently entry screen shows 'Welcome back' or sign-in. After first sign-in, user should see onboarding: set budget period (calendar month vs payday), add first budget category, optionally connect bank. Use native modal or stack for onboarding flow. Files: apps/mobile/app/onboarding/_layout.tsx, apps/mobile/app/onboarding/budget-period.tsx, apps/mobile/app/onboarding/first-budget.tsx. Track completion in UserProfile or BudgetConfig.createdAt.
- 🟠 **Add settings screen (manage profile, disconnect bank, logout, privacy/terms links)** (blocks: app-store)  
  No /settings screen. Build apps/mobile/app/(tabs)/settings.tsx with: user name/email display, logout button, disconnect-bank buttons (per connection), app version, links to privacy/terms/feedback. POST /api/banking/disconnect/{connectionId} to delete BankConnection.
- 🟡 **Implement transaction detail screen and merchant/category information enrichment** (blocks: app-store)  
  List screen shows only transactions; need drill-down detail screen (/transactions/[id]) with full metadata: merchant logo (from Pexels or merchant data), category icon, date/time, description, balance change, recurring status (if applicable). Web backend has merchant.ts for enrichment—could call or use same logic.
- 🟠 **Create home/dashboard summary card (total balance, this month's spending, budget utilization %, recent transaction)** (blocks: both)  
  Entry screen is placeholder. After sign-in, /(tabs)/ should show: (1) total balance across all accounts (sum of BankAccount.balance), (2) this month's spending (sum of transactions in current period), (3) budget utilization gauge (actual vs budgeted), (4) quick action buttons (add transaction category / connect bank). Reuse web DashboardPage query logic.
- 🔴 **Handle web backend feature completion: ensure all APIs are actually implemented and documented** (blocks: both)  
  Mobile depends on web backend API routes that don't exist yet (/api/transactions, /api/budgets, /api/insights, /api/banking/accounts). Web app only has auth mobile routes + banking sync/callback. Schedule parallel work: mobile screens + web API routes must complete together before mobile can test/launch.
- 🟠 **Secure API authentication: verify JWT token middleware, rate limiting, CORS on all product routes** (blocks: both)  
  Mobile auth routes check token via verifyToken() and getCurrentUserFromToken(). Ensure ALL new product API routes (transactions, budgets, insights, accounts) do the same. Add rate limiting (use-cases: brute-force prevent, free tier limiting). CORS already set on auth routes—replicate on product routes. Implement middleware or helper: apps/web/lib/auth-middleware.ts.
- 🟡 **Implement Sentry error reporting for mobile (native crashes + React errors)** (blocks: neither)  
  Web app has Sentry configured (sentry.server.config.ts, sentry.client.config.ts, sentry.edge.config.ts). Mobile has none. Install: pnpm add @sentry/react-native. Initialize in entry screen, wire into error boundary. Capture native crashes, JS exceptions, Redux state context.
- 🟡 **Add spending insights generation (AI/ML predictions, budget recommendations, anomaly detection)** (blocks: neither)  
  Web backend has ai/insights.ts (budget-suggestions, categorization, anomaly detection). Mobile needs to display these AiInsights (already in DB schema), but generation must run server-side (job queue or cron). Ensure backend populates aiInsights table regularly. Mobile just consumes via GET /api/insights.

### GENWEL DEPLOYMENT + INFRASTRUCTURE + ENV READINESS
The web app (apps/web) is linked to Vercel (projectId: prj_52hqFGSXMpZwr7woSe8ddRLNYaHs) but no production CI/CD pipeline exists yet. All required env vars for core features (Auth, TrueLayer, Sentry, PostHog, Sanity, Resend, AI models) are documented in .env.example and fully populated in .env.local for local dev. Critical gaps: (1) production env vars NOT YET configured on Vercel, (2) Apple/Google mobile auth credentials missing from .env.example (code uses them), (3) Anthropic SDK not yet installed (planned), (4) no web app deployment trigger/workflow, (5) Neon prod branch exists but not validated in CD.

**Done:**
- ✅ Vercel project linked to apps/web (projectId: prj_52hqFGSXMpZwr7woSe8ddRLNYaHs)
- ✅ Next.js config: Sentry + Plausible + PostHog rewrites in place (next.config.ts)
- ✅ Prisma: using neon adapter + serverless for edge-safe Postgres queries
- ✅ Database: Neon branches set up (production br-hidden-violet-ahpayw2m, development br-square-fire-ahs8zxcs)
- ✅ DB migrations: GitHub Actions CI workflow validates + deploys on push to main (database-migrations.yml)
- ✅ Auth: NextAuth v5 beta wired with OAuth (Google/Apple/Facebook) and magic-link (Resend email)
- ✅ OAuth: Google, Apple, Facebook client IDs + secrets populated in .env.local and auth.ts
- ✅ Apple: client secret generation working (lib/apple.ts uses jose ES256 JWT with 6-month self-rotation)
- ✅ TrueLayer: sandbox configured with auth/callback routes + account/transaction Prisma models
- ✅ AI models: OpenAI (gpt-4o/-mini/5.2) + Google Gemini (3-flash/3-pro) wired in lib/ai/models.ts
- ✅ Sentry: server/client/edge configs in place + instrumentation.ts setup, Sentry org/project configured
- ✅ PostHog: server + client wiring (lib/posthog-server.ts + instrumentation), keys in .env.local
- ✅ Sanity: CMS client + API token configured (schema deployed)
- ✅ Email: Resend wired for magic-link + DEFAULT_FROM_EMAIL set
- ✅ Mobile app: EAS configured with development/preview/production build profiles
- ✅ Cron: blog generation scheduled in vercel.json (0 9 * * 1,3,5)

**Remaining:**
- 🔴 **Configure production environment on Vercel** (blocks: web)  
  All 28 env vars from .env.example must be set in Vercel Settings > Environment Variables for the production deployment. Currently only linked to .env.local. Vercel project ID prj_52hqFGSXMpZwr7woSe8ddRLNYaHs exists but prod env incomplete. Require: DATABASE_URL (prod Neon branch string), NEXTAUTH_SECRET, OAuth secrets (GOOGLE_CLIENT_SECRET, APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, FACEBOOK_CONSUMER_APP_ID/SECRET), OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, PEXELS_API_KEY, Sentry tokens, PostHog key, Sanity tokens, Resend key, TrueLayer creds, CRON_SECRET.
- 🟠 **Add missing OAuth env vars to .env.example** (blocks: web)  
  File: /Users/ezeikel/Development/Personal/genwel/apps/web/.env.example. Missing (used in code but not documented): APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_BUNDLE_IDS (referenced in app/api/auth/mobile/apple/route.ts), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (referenced in auth.ts + mobile routes), FACEBOOK_CONSUMER_APP_ID, FACEBOOK_CONSUMER_APP_SECRET (auth.ts line 88-96). These must be added as commented sections for OAuth providers so new developers know they are required for sign-in to work.
- 🟠 **Verify Neon production branch connectivity in CI/CD** (blocks: web)  
  DATABASE_URL for prod branch (br-hidden-violet-ahpayw2m) is configured in CLAUDE.md but not yet tested in GitHub Actions workflow. The database-migrations.yml workflow uses secrets.DATABASE_URL but doesn't validate it connects to prod. Add a pre-migration health-check step (psql -c 'SELECT 1' against the prod branch URL from secrets).
- 🟠 **Implement web app deployment workflow** (blocks: web)  
  No .github/workflows trigger for Vercel deployment of apps/web exists. Only database-migrations.yml is present. Create a deploy.yml or push vercel-deployment.yml that: (1) listens to push to main on paths apps/web/** or packages/db/**, (2) runs tests/build check, (3) triggers Vercel deployment for prj_52hqFGSXMpZwr7woSe8ddRLNYaHs. Can use vercel-action or Vercel's native Git integration if Vercel auto-deploys. Confirm auto-deploy is enabled in Vercel project settings.
- 🟡 **Install Anthropic SDK (planned feature)** (blocks: neither)  
  apps/web/package.json currently has @ai-sdk/google + @ai-sdk/openai but not @ai-sdk/anthropic. ASK-GENWEL-PLAN.md (line 68) calls for adding anthropic for Claude Sonnet advisor model + fallback chain. Add @ai-sdk/anthropic and ANTHROPIC_API_KEY to .env.example when that feature is built; not blocking current deployment but needed for Ask Genwel.
- 🔵 **Verify EMAIL_FROM env var usage** (blocks: neither)  
  Code grep shows EMAIL_FROM referenced in app/api routes but .env.example only documents DEFAULT_FROM_EMAIL. Check if EMAIL_FROM is a duplicate or legacy name; if still in use, add to .env.example or consolidate.
- 🟠 **Validate TrueLayer production credentials** (blocks: web)  
  NEXT_PUBLIC_TRUELAYER_ENV defaults to 'sandbox' in code (lib/truelayer/client.ts line 9). For production launch, confirm: (1) NEXT_PUBLIC_TRUELAYER_ENV is set to 'production' in Vercel prod env, (2) production TrueLayer client_id/secret are provisioned (different from sandbox creds in .env.local), (3) redirect URI on TrueLayer dashboard matches production deployment URL.
- 🟡 **Document Neon branch strategy for prod deployments** (blocks: neither)  
  CLAUDE.md documents development branch but doesn't explain how the production branch (br-hidden-violet-ahpayw2m) is used or protected. Add: (1) prod branch is read-only in CI (prisma migrate deploy only), (2) branch protection: backups, no direct deletes, (3) how to monitor and handle migration failures on prod.
- 🟡 **Sentry + PostHog: Verify secrets are set on Vercel** (blocks: web)  
  SENTRY_AUTH_TOKEN and SENTRY_DSN are in .env.local but must be copied to Vercel prod env. PostHog key is public (NEXT_PUBLIC_POSTHOG_KEY) but confirm SENTRY_ORG + SENTRY_PROJECT are set for upload-on-build. Verify Sentry tunnel route (/monitoring) is not blocked by Vercel middleware.
- 🟠 **Mobile auth: APPLE_BUNDLE_IDS for production** (blocks: both)  
  Code references process.env.APPLE_BUNDLE_IDS (app/api/auth/mobile/apple/route.ts) for JWT audience validation but .env.example does not document it. Add APPLE_BUNDLE_IDS (comma-separated: 'com.chewybytes.genwel' for iOS, Android app ID for Android) to .env.example as a required var for mobile sign-in.

### iOS + Android App Store Submission Readiness (Genwel Mobile)
Genwel's mobile app is an empty Expo placeholder with well-structured configuration but zero functional implementation, no monetization setup, and critical missing infrastructure for App Store submission. The app.config.ts and eas.json are properly configured for multi-environment builds, but the iOS app record has not been created (ascAppId is TODO), the Android service account key is missing, and essential compliance/legal infrastructure does not exist. Without the web MVP's privacy policy, App Privacy declarations (banking data = sensitive scrutiny), account deletion backend support, and demo account setup, the app cannot pass Apple or Google review. This is a from-scratch Expo build, not a polish task.

**Done:**
- ✅ Bundle identifiers finalized for all three environments: com.chewybytes.genwel.app (production), .app.internal (preview), .app.dev (development)
- ✅ App configuration complete with Expo Router, Apple Sign In + Google sign-in plugins, secure-store for session tokens, and build properties (compileSdkVersion/targetSdkVersion 36, static frameworks for iOS)
- ✅ Graphics assets present: icon.png (1024x1024), adaptive-icon.png (1024x1024 with Genwel forest green #114E37 background), splash-icon.png (512x512)
- ✅ EAS build profiles configured for development (simulator, internal distribution), preview (device, internal), production (store submission), and prod-apk (debug build)
- ✅ Apple team credentials in eas.json: appleTeamId HGX827L49J, appleId developer@chewybytes.com (per Chewy Bytes org)
- ✅ Deep linking infrastructure configured: iOS associatedDomains applinks:genwel.com, Android intent filters for https and genwel custom scheme
- ✅ iOS entitlements configured for Apple Sign In (com.apple.developer.applesignin)
- ✅ App name variants configured per environment (Genwel / Genwel Internal / Genwel Dev)
- ✅ OTA updates configured via EAS Project ID 53254185-1bd7-4d7b-8647-cd10bbb0020b with update checks disabled (checkAutomatically: NEVER)

**Remaining:**
- 🔴 **Create iOS app record in App Store Connect and obtain real ascAppId** (blocks: both)  
  eas.json line 81 has ascAppId hardcoded as 'TODO_ASC_APP_ID'. Step 1: Log into App Store Connect with developer@chewybytes.com. Step 2: Create new app (iOS platform, bundle ID com.chewybytes.genwel.app). Step 3: Get the 9-digit app ID from the app details page. Step 4: Update eas.json line 81 with the real ID. Without this, eas submit will fail before building. Reference: asc-app-create-ui skill.
- 🔴 **Create Google Play app record and generate Google service account key** (blocks: both)  
  eas.json line 75 references ./google-service-account.json but file does not exist. Step 1: Log into Google Play Console. Step 2: Create new app (package name com.chewybytes.genwel.app). Step 3: Generate service account key via Google Cloud Console and save to apps/mobile/google-service-account.json. Ensure .gitignore includes it. Without this, Android submission will fail.
- 🔴 **Implement privacy policy URL and App Privacy declaration for iOS and Android Data Safety** (blocks: both)  
  Genwel is a BANKING APP handling Open Banking data (accounts, transactions, balances). Apple and Google scrutinize finance apps extensively. Step 1: Create /legal/privacy page on apps/web with compliant privacy policy (data collection scope, TrueLayer OAuth flow, data retention, encryption, GDPR provisions). Step 2: In App Store Connect, link privacy policy URL. Step 3: Declare all data types collected (financial info, user ID, device ID). Step 4: In Google Play, complete Data Safety form (sensitive financial data = maximum scrutiny). Incomplete declarations = immediate rejection.
- 🔴 **Implement account deletion support (Apple App Store Review Guideline requirement)** (blocks: both)  
  Apple requires users to delete accounts directly in-app or via web form. Step 1: Add DELETE /api/auth/delete-account route that verifies session, deletes User + all related data (BankConnections, BankAccounts, Transactions, etc.) via Prisma cascades, and clears session. Step 2: Expose Settings > Delete Account button in mobile app. Step 3: Document deletion in privacy policy. Step 4: In App Store Connect, provide account deletion URL in Developer Contact section. Without this, app will be rejected during review.
- 🟠 **Set up RevenueCat subscription infrastructure (NOT IMPLEMENTED; no monetization yet)** (blocks: neither)  
  apps/mobile/README.md lists RevenueCat as planned but NOT configured. The app does not use RevenueCat SDK, has no subscription products, and no paywall UI. Step 1: Install react-native-purchases via expo install. Step 2: Add to app.config.ts plugins with apiKey from RevenueCat dashboard. Step 3: In RevenueCat dashboard, create entitlements (genwel-pro) and configure iOS App Store and Google Play products. Step 4: Build paywall UI. Contingent on monetization decision (free alpha vs. Genwel Pro £4.99-6.99/mo vs. freemium).
- 🟠 **Create demo/test account for App Store review process** (blocks: both)  
  Step 1: Create test Apple ID (review+genwel@chewybytes.com) separate from developer account. Step 2: Create Genwel account in production with: (a) connected bank via TrueLayer mock (john/doe), (b) 30+ days of visible transactions, (c) at least one configured budget. Step 3: Document credentials securely and include in App Store Review Notes. Step 4: Ensure account is available for 48-72 hour review window. App Store reviewers will test full flow (sign in, view accounts, sync transactions) using this account.
- 🟠 **Write app store listing copy and take app screenshots (iOS + Android)** (blocks: both)  
  Step 1: Take screenshots of sign-in, account overview, transaction list, budgets/insights, feature highlights. Step 2: Write App Name 'Genwel', Subtitle 'AI-powered finance for families' (max 30 chars iOS). Step 3: Write Description (max 4000 chars). Step 4: Write Keywords. Step 5: Set category (Finance), age rating (12+/4+). Requires minimum 2-5 screenshots per platform, feature graphics (1200x500px iOS, 1024x500px Android). Per playbook: asc-aso-audit and app-store-optimization skills.
- 🟠 **Implement proper app permissions justification for iOS + Android** (blocks: both)  
  Step 1: Add to app.config.ts ios.infoPlist NSBiometricUsageDescription and NSFaceIDUsageDescription (required by Apple). Step 2: Add Android permissions (e.g., READ_CONTACTS if bill split features use contacts). Step 3: Document each permission in App Store Connect App Privacy section. Step 4: In Google Play, justify permissions in Data Safety form. Step 5: Audit app to ensure no unused permissions (Google Play rejects over-permissive apps). SECURITY: TrueLayer tokens stored plaintext must be fixed (use react-native-encrypted-storage or Secure Enclave).
- 🟡 **Configure TestFlight beta review for iOS before App Store submission** (blocks: app-store)  
  Step 1: Create 'testflight' build profile in eas.json extending 'production' with distribution 'internal'. Step 2: Run eas build --profile testflight. Step 3: Add Chewy Bytes team members to App Store Connect as testers. Step 4: Upload build to TestFlight and invite internal testers for 1-2 weeks. Step 5: Collect feedback and fix blockers before App Store Review submission. Highly recommended; prevents many rejections.
- 🟠 **Add required metadata to both stores: developer contact, support URL, category, rating** (blocks: both)  
  Step 1: In App Store Connect, set Category (Finance), Support URL, Developer Name and email, COPPA flag to No. Step 2: Set App Privacy Policy URL (required, must be https). Step 3: In Google Play Console, fill Category (Finance), complete Content Rating Questionnaire (required), add developer contact/support email/website. Step 4: Set minimum app rating and content guidelines. Without this metadata, app cannot be submitted for review.
- 🟠 **Ensure no hardcoded secrets, API keys, or TrueLayer tokens in app binary** (blocks: both)  
  Step 1: Verify all sensitive env vars loaded from eas.json env block or .env.production (never hardcoded). Step 2: Ensure EXPO_PUBLIC_* vars are truly public (no API keys). Step 3: Audit app.config.ts and package.json for hardcoded tokens/endpoints. Step 4: Use react-native-secure-store (in dependencies) to store access tokens at runtime, not AsyncStorage. Step 5: For TrueLayer OAuth callback, derive userId from next-auth session, NOT unsigned state (CSRF vulnerability). Google Play and App Store automated scanners reject hardcoded credentials.
- 🟠 **Complete Android build and submission configuration (google-play-cli wrapper)** (blocks: app-store)  
  Step 1: Ensure google-service-account.json in place. Step 2: Test build locally: eas build --profile production --platform android to generate AAB. Step 3: Verify AAB is signed correctly. Step 4: Use google-play-cli or Google Play Console web UI to upload AAB. Step 5: Set release notes, rollout percentage (start 10-20% phased), and submit for review. Android review typically 2-4 hours; iOS 24-48 hours. Per playbook: google-play-cli wrapper.
- 🟠 **Verify Android app links and deep linking validation (Android requirement)** (blocks: app-store)  
  Android requires assetlinks.json at https://genwel.com/.well-known/assetlinks.json proving app ownership. Step 1: Generate correct JSON for app signing key fingerprint via keytool. Step 2: Deploy assetlinks.json (accessible via HTTPS). Step 3: Test deep linking locally with adb. Step 4: Verify on Google Play Console after upload. Without this, Android users clicking genwel.com links will not be offered the app. Validated during Google Play review.

### AI / Differentiator Ask Genwel Wedge Readiness
Genwel has working AI foundations (transaction categorization via Gemini Flash with merchant cache, budget suggestions and insights via GPT-5.2) but zero implementation of the planned differentiator wedge. The Ask Genwel financial advisor chat, duplicate-subscription detection, and biggest fixable problems ranked feed are entirely unbuilt. The founder decided in AUDIT-2026-06.md to HOLD launch until the duplicate-subscription/fixable-problems feature is in v1, making these wedge features launch blockers. The infrastructure required is substantial: agent loop (AI SDK v6 plus Anthropic), conversation persistence (new Prisma models), tool registry with guards, fail-open guardrails, and optionally voice stack (Cloudflare Worker, Deepgram, ElevenLabs). Current state: 6+ weeks of engineering ahead to meet the hold-for-wedge launch bar.

**Done:**
- ✅ Transaction categorization: Working via Gemini Flash (models.analytics) with merchant-key normalization and per-session in-memory caching; avoids redundant AI calls within a single sync
- ✅ Budget suggestions: Implemented via GPT-5.2 (models.intelligent), generates per-category limits from 3-month spend history, stored in Prisma BudgetConfig/Budget
- ✅ Spending insights: Implemented via GPT-5.2, compares current vs previous month, detects anomalies/trends, stored in AiInsight table with 48h TTL
- ✅ AI model layer (lib/ai/models.ts): Configured with OpenAI (GPT-4o, GPT-5.2) and Google (Gemini 3-flash, 3-pro), includes retry/backoff utilities with exponential jitter for Gemini free-tier 429s
- ✅ Merchant normalization (lib/banking/merchant.ts): Derives canonical merchant keys from descriptions, strips legal suffixes and noise for stable grouping
- ✅ Categorization service (lib/banking/categorize.ts): Merchant cache per invocation, bounded batch processing (5 batches x 20 txn default), status reporting (aiCategorized, cached, remaining counts)
- ✅ Server actions (actions/ai-budgets.ts): categorizeTransactions, getAiBudgetSuggestions, generateInsights, markInsightRead all exposed as server actions with auth gate
- ✅ AI SDK v6 with fallback pattern ready: Retry utilities support createFallback() for multi-provider resilience (though not yet wired)
- ✅ Image evaluation (lib/ai/image-evaluation.ts): Gemini 3-pro vision for blog featured images, sequential evaluation (concurrency=1) to avoid 429s on free tier
- ✅ Prompts (lib/ai/prompts.ts): Blog topics and financial context available; system messages for categorization, insights, budgets drafted

**Remaining:**
- 🔴 **Agent core (lib/agents/advisor.ts): AI SDK v6 streamText with bounded loop** (blocks: both)  
  Does not exist. Must implement: buildAdvisorAgent() using streamText() with stopWhen: stepCountIs(6), onStepFinish callback for per-step tool validation and result recording, onFinish for atomic persistence. Requires adding @ai-sdk/anthropic (currently not in package.json; only @ai-sdk/google and @ai-sdk/openai present) and Claude Sonnet as primary model with Gemini-2.5-flash fallback via createFallback(). See ASK-GENWEL-PLAN.md lines 39-42 for detailed specification.
- 🔴 **Financial tool registry (lib/agents/tools/): 6 financial advisor tools** (blocks: both)  
  Directory does not exist. Must implement: queryTransactions (paginated txn fetch, category+merchant filter), getSpendingByCategory (period comparison, budget alignment), findDuplicateSubscriptions (recurring debit detection via merchant+amount+cadence heuristic, return confidence level), getBudgetStatus (current/projected overspend), getBiggestFixableProblems (ranked savings opportunities), getInsights (read/write AiInsight). Each tool requires Zod schema, toModelOutput() formatter, and Prisma client closure. Spec in ASK-GENWEL-PLAN.md lines 55-65. The duplicate-subscription tool is the wedge differentiator and is NOT in scope until this is built.
- 🔴 **Tool guards (lib/agents/tool-guards/): Pluggable availability checks and validation** (blocks: both)  
  Does not exist. Must implement: RequireConnectedBankGuard (canRun() checks if user has active BankConnection), InputValidator (length cap, injection regex, tri-state result), OutputValidator (strips account numbers, sort codes, TrueLayer tokens, Prisma table names), and parallel fail-open Gemini classifier for financial safety. No tool execution permitted if required bank connection missing. See ASK-GENWEL-PLAN.md lines 71-72, Appendix tool-guards section (lines 139-146, 147-151).
- 🔴 **Conversation persistence (Prisma models AskConversation, AskMessage)** (blocks: both)  
  Does not exist. Must add to schema.prisma: AskConversation (id, userId, title, titleStatus, createdAt, updatedAt, messages relation), AskMessage (id, conversationId, turnId, role, content JSON, summary, skip, interrupted, isNudgeContext, createdAt). Indexes on (conversationId, createdAt) and (conversationId, turnId); unique on (conversationId, turnId, role). Run pnpm db:migrate in packages/db. See ASK-GENWEL-PLAN.md lines 264-300 for full schema.
- 🔴 **Route handlers: POST /api/ask-genwel/authorize and /chat** (blocks: both)  
  Does not exist. Directories and files not created. /api/ask-genwel/ must have two route handlers: (1) authorize - resolves/creates conversation (explicit id, forceNew, or 30-min auto-resume), returns conversationId; (2) chat - streaming handler receiving text, calling buildAdvisorAgent(), returning result.toUIMessageStreamResponse(). Both gate on next-auth session. See ASK-GENWEL-PLAN.md lines 73-74. Will also need GET /api/ask-genwel/messages for history pagination.
- 🔴 **System prompt and context injection (lib/agents/context.ts)** (blocks: both)  
  Does not exist. Must assemble user's financial snapshot at turn start: BankAccount balances, last 90d Transaction aggregates by aiCategory, BudgetConfig/Budget status, recent AiInsight rows. Build cached system message with providerOptions.anthropic cacheControl on system block plus last two user turns (per Anthropic prompt caching). Reuse existing Prisma queries. See ASK-GENWEL-PLAN.md lines 71-72.
- 🔴 **UI component: Ask Genwel chat surface (components/ask-genwel/)** (blocks: both)  
  Does not exist. Must build shadcn chat UI using useChat: unified message rendering, markdown with DOMPurify, typewriter animation continuing across deltas, InsightCard rendering for tool-result financial cards, reveal-cards-after-text-completes coordination, auto-scroll, infinite-scroll history. See ASK-GENWEL-PLAN.md lines 76, 51-52 for scope. Cannot launch wedge without user-facing chat.
- 🔴 **Duplicate-subscription detection heuristic (findDuplicateSubscriptions tool)** (blocks: both)  
  The core wedge feature. Does not exist. Must detect: transactions grouped by merchant name (normalize via lib/banking/merchant.ts), recurring charges at same-ish amount (allow 0-5% variance for fees), flagging overlapping services (multiple Netflix charges, etc.). Return {suspectedDuplicates: [{merchant, amounts, cadence}], confidence: high|medium|low}. No AI required; pure heuristic over Transaction rows. See ASK-GENWEL-PLAN.md lines 61, 195. This is THE differentiator Emma does not have; without it MVP is just another budget tracker.
- 🔴 **Biggest fixable problems ranking (getBiggestFixableProblems tool)** (blocks: both)  
  Composite analyzer that does not exist. Must rank fixable issues: duplicate subs, fee-bearing recurring charges, categories trending over budget, dormant-but-charging services. Return prioritized list with estimated monthly savings. Call tools above (or query directly) to aggregate. See ASK-GENWEL-PLAN.md lines 63, 195. This powers the headline Ask Genwel answer and drives user engagement.
- 🔴 **Add @ai-sdk/anthropic to package.json and ANTHROPIC_API_KEY to .env** (blocks: both)  
  Package not in apps/web/package.json dependencies (only @ai-sdk/google, @ai-sdk/openai present). Must add @ai-sdk/anthropic per AI SDK v6 docs (likely ^3.0.x to match other SDKs at v3.0.83). Add ANTHROPIC_API_KEY to .env.example and .env.local for local dev. See ASK-GENWEL-PLAN.md line 68.
- 🟠 **Sub-agent for conversation titles (titleConversation)** (blocks: neither)  
  Does not exist. After ~3 messages, fire-and-forget async title generation via gemini-flash using generateObject with 2s timeout. Persist to AskConversation.title. See ASK-GENWEL-PLAN.md lines 77, Appendix on sub-agent pattern (lines 112, 117). Not a blocker but improves UX for conversation history.
- 🟠 **Observability: experimental_telemetry plus Sentry/PostHog spans** (blocks: neither)  
  Not integrated with agent. Must wrap streamText with experimental_telemetry config object (functionId=ask-genwel-advisor) and emit Sentry/PostHog server events with userId, conversationId, turnId. See ASK-GENWEL-PLAN.md lines 77, Appendix (line 102, 118-119). Not a blocker but critical for debugging and usage analytics.
- 🟠 **Voice stack (Cloudflare Worker, Durable Object, Deepgram, ElevenLabs)** (blocks: web)  
  Does not exist. Plan calls for voice-text dual path per ASK-GENWEL-PLAN.md lines 20-35. Text path is HTTP/SSE (Next.js route handler direct to agent); voice path requires porting Swap's wire-worker (Cloudflare Worker + DO listening on WebSocket, running Deepgram STT + ElevenLabs TTS, forwarding to agent core over HTTP). Also needs @elevenlabs/sdk and Deepgram client libraries. Not a blocker for text-only MVP but required for full wedge. Spec in Appendix (lines 366+). Defer to post-MVP if founders want text first.
- 🟡 **Gemini API key restriction issue (existing, affects current AI)** (blocks: neither)  
  AUDIT-2026-06.md documents Gemini free tier (5 req/min quota) causing 429 errors during batch categorization and image evaluation. Image-evaluation.ts line 138 already uses concurrency=1 to mitigate. Categorization batch size is hardcoded at 20, with retry backoff. Current workaround: sequential evaluation, retry/backoff. Future: upgrade to Gemini paid API or migrate categorization to GPT-4o-mini (cheaper, no free-tier limits). For now, backoff is working but slow. Not a blocker for Ask Genwel (uses different models) but constrains current throughput. See AUDIT-2026-06.md line 28-32.
- 🔵 **Conversation compression logic (deferred MVP)** (blocks: neither)  
  Deferred per ASK-GENWEL-PLAN.md line 78. Only needed when conversations exceed ~20-30 turns (50KB text). If implemented, must preserve tool-call/tool-result pairs (Swap commit c2772f30 reference at lines 86, 356): when summary exists, reconstruct message.content as array with summary text plus toolCallParts. This is non-negotiable for Claude reasoning correctness. Schema already supports it (summary column). Implement later if long sessions become common.
- 🔵 **Offline eval harness (deferred MVP)** (blocks: neither)  
  Deferred per ASK-GENWEL-PLAN.md line 79. A small set of canned financial questions graded by LLM judge to regression-test answer quality before prompt changes. Build once real conversations exist. Not a blocker.

## Appendix B — Blocker verifications

- ✅ REAL — **Create legal pages (Terms, Privacy, Cookies)**: Confirmed real. SignInForm.tsx (lines 196-202) contains links to /terms and /privacy, but these directories and page.tsx files do NOT exist in /Users/ezeikel/Development/Personal/genwel/apps/web/app/. Verified via: (1) Directory listing of app/ shows no terms/privacy/cookies directories, (2) Grep search finds only the SignInForm links referencing these routes with no implementations, (3) next.conf
- ✅ REAL — **Implement waitlist form submission (/api/waitlist)**: CONFIRMED REAL. Evidence:

1. TODO comments exist exactly as claimed:
   - /Users/ezeikel/Development/Personal/genwel/apps/web/components/HeroSection.tsx line 23: "// TODO(phase-3): POST to /api/waitlist + emit posthog waitlist_signup" (git commit 6c6f149)
   - /Users/ezeikel/Development/Personal/genwel/apps/web/components/Footer.tsx line 22: "// TODO(phase-3): POST to /api/waitlist + emit posthog
- ✅ REAL — **Add FCA/financial service disclaimers**: Confirmed REAL and severe. Multiple critical gaps found:

1. FALSE FCA CLAIMS: Footer claims "FCA Registered" (/Users/ezeikel/Development/Personal/genwel/apps/web/components/launch/LaunchFooter.tsx:100-101) and EmptyState displays "FCA regulated" (/Users/ezeikel/Development/Personal/genwel/apps/web/components/dashboard/EmptyState.tsx:82) — no FCA registration number (FRN), no firm reference, no ev
- ✅ REAL — **Fix footer links**: CONFIRMED REAL - Multiple dead/broken footer links exist in /Users/ezeikel/Development/Personal/genwel/apps/web/components/Footer.tsx:

DEAD COMPANY LINKS (lines 23-26):
- About: href="#" (no route, no content) 
- Careers: href="#" (no route, no content)
- Contact: href="#" (no route, no content)

DEAD LEGAL LINKS (lines 29-31):
- Privacy Policy: href="#" (no route exists, but /privacy referenced 
- ✅ REAL — **Switch TrueLayer from sandbox to production**: CONFIRMED REAL. File /Users/ezeikel/Development/Personal/genwel/apps/web/.env.local line 16 shows NEXT_PUBLIC_TRUELAYER_ENV="sandbox". Code at /Users/ezeikel/Development/Personal/genwel/apps/web/lib/truelayer/client.ts lines 9-44 conditionally routes to sandbox endpoints and uses mock provider when env=sandbox. Sandbox credentials in .env.local cannot access real banks. Recent audit (/Users/ezeike
- ❌ STRUCK — **Implement waitlist database model**: Already done / Not applicable. The waitlist was never implemented — the page existed but the form only logged to console (TODO comment in HEAD HeroSection.tsx line ~17: "// TODO(phase-3): POST to /api/waitlist"). No /api/waitlist route ever existed. No Prisma model was ever added. Sanity schema has no waitlist type. Current uncommitted work (apps/web/next.config.ts, HeroSection.tsx, apps/web/app/w
- ✅ REAL — **Create product navigation structure (home, accounts, transactions, budgets, insights tabs or stack)**: Confirmed real blocker. The mobile app routing is genuinely missing. Evidence: (1) /Users/ezeikel/Development/Personal/genwel/apps/mobile/app/ contains only 4 files (index.tsx, magic-link.tsx, _layout.tsx, providers.tsx) with no (tabs) directory or dashboard structure; (2) _layout.tsx lines 20-28 use Stack navigation with only index and magic-link screens, no Tab.Screen; (3) /Users/ezeikel/Develop
- ❌ STRUCK — **Build product API client layer for mobile (fetch wrappers for accounts, transactions, budgets, banking, insights)**: (verification agent dropped)
- ✅ REAL — **Implement Accounts screen (list bank connections, connect new bank via TrueLayer)**: CONFIRMED REAL BLOCKER. Evidence: (1) Mobile app structure is placeholder-only: /apps/mobile/app/ contains only index.tsx (sign-in prompt), magic-link.tsx, _layout.tsx, providers.tsx — NO accounts screen, NO tabs structure, NO accounts.tsx (claimed path doesn't exist). (2) No GET /api/banking/accounts endpoint exists on web backend: /apps/web/app/api/banking/ contains only callback/route.ts, sync/
- ✅ REAL — **Implement Transactions screen (paginated list, filtering, search)**: CONFIRMED REAL but file path overstated. Evidence: (1) Mobile app directory (/Users/ezeikel/Development/Personal/genwel/apps/mobile/app/) contains only sign-in flow files—no (tabs) directory exists yet. (2) No /api/transactions endpoint exists in /Users/ezeikel/Development/Personal/genwel/apps/web/app/api/; web app queries transactions via server-side Prisma in dashboard/transactions/page.tsx. (3)
- ✅ REAL — **Implement Budgets screen (CRUD budgets by category)**: CONFIRMED REAL BLOCKER. The claim is accurate and represents a genuine blocking issue. Evidence: (1) Mobile app structure non-existent: /Users/ezeikel/Development/Personal/genwel/apps/mobile/app/ contains only 4 files (index.tsx, magic-link.tsx, _layout.tsx, providers.tsx), no tab navigation or budgets screen. Comment in index.tsx line 8 states "placeholder until the budgeting screens land" and li
- ✅ REAL — **Implement Insights screen (AI-generated insights, spending trends, anomalies)**: CONFIRMED REAL: The blocker is genuine. While the web backend has fully implemented insight generation (/apps/web/lib/ai/insights.ts generates spending_trend, anomaly, saving_tip, budget_suggestion types) and an AiInsight Prisma model with all required fields (type, title, body, read, expiresAt), the critical gap is that (1) no REST API routes exist at /api/insights to expose this data to mobile, 
