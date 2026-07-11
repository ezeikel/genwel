# Genwel Pricing Plan

**Status:** ✅ APPROVED (2026-07-11) — ready for Stripe build
**Model:** Freemium (free tier + paid upgrade)
**Positioning:** UK AI-powered Open Banking budgeting app — "better than Emma"

## ✅ Confirmed decisions
- **Pro: £6.99/mo** or **£54.99/yr** (34% off = £4.58/mo effective)
- **Free-tier bank limit: 2** (matches Emma; natural upgrade wall)
- **1 paid tier** (Free + Pro) — no Ultimate for now
- **7-day free trial** on Pro; annual pre-selected on paywall

---

## 1. What the verified research says (deep-research, source-cited, adversarially verified)

The competitive picture, corrected against sources — several of my earlier assumptions were wrong:

| App | Reality | Relevance to Genwel |
|-----|---------|---------------------|
| **Emma** | Freemium. Free "Basic" (2 bank logins, no budgets/net worth) + **Plus £4.99/mo (£41.99/yr)**, **Pro £9.99/mo (£83.99/yr)**, **Ultimate £14.99/mo (£124.99/yr)**. 7-day trial, ~30% annual discount. | **The direct reference.** Clean freemium anchor. |
| **Moneybox** | **NOT a budgeting competitor** — it's a save-and-invest platform (£1/mo + 0.45% platform fee). | Ignore for pricing; different category. |
| **Cleo** | US-first, USD only. Free tier includes AI chat + budgeting; cash advances paywalled. **Exited UK 2022, relaunched Feb 2026 with NO UK paid tier.** | AI-chat validation, but **no UK pricing to match** — an opening. |
| **Snoop / Plum / others** | Mostly free or fee-on-savings models; no clean subscription anchor. | Confirms Emma is the band-setter. |

**Verified industry band:** UK budgeting subscriptions sit at **£4.99–£14.99/mo**, annual discounts **~25–30%**, **7-day** trials (not 14), **freemium** (not trial-then-paid) is standard.

**Consistently-paywalled features across the market:** unlimited bank connections · monthly budgets · custom categories · accurate net worth · savings goals · subscription/recurring detection · data export.

---

## 2. Strategy — how Genwel prices to *beat* Emma, not copy it

Emma's weakness is that its AI is thin — it gates *quantity* (bank logins, categories). Genwel's moat is **AI depth**: the Fixable-Problems wedge (already built), richer Open-Banking insights, and Ask Genwel (the conversational agent). So Genwel should:

1. **Gate on AI value, not just connection count.** The free tier proves the product on real data; the paid tier unlocks the *intelligence* — which is exactly where Genwel out-classes Emma and where willingness-to-pay is highest.
2. **Simplify to 2 tiers, not 4.** Emma's 4-tier ladder creates choice paralysis and hides the value. A single, obvious **Free → Pro** decision converts better for a self-serve consumer app.
3. **Undercut Emma's Pro (£9.99) while over-delivering on AI.** Price at **£6.99/mo** — below Emma Pro, above Emma Plus — positioned as "everything Emma Pro has, plus the AI Emma doesn't."

### Value metric
Not per-seat (single-user consumer app). The value scales with **AI depth + connections**: free users get the core money view on limited connections; Pro unlocks unlimited connections *and* the full AI layer. This keeps price aligned with the value Genwel uniquely delivers.

---

## 3. Proposed tiers

### 🆓 Free — "See your money clearly"
The genuinely-useful free tier that gets people connected and hooked. **More generous than Emma's free tier** (Emma gives 2 logins and no budgets — deliberately frustrating). Genwel's free tier should feel complete enough to love, incomplete enough to upgrade.

- Connect up to **2 banks** (accounts + credit cards)
- Automatic AI transaction categorization
- Net worth + balances across accounts
- Spending by category (current month)
- **1 free "Fixable Problem"** revealed per month (the hook — see the wedge, upgrade to see them all)
- Recent transactions + search

### ⭐ Pro — **£6.99/mo** or **£54.99/yr** (~34% off, = £4.58/mo)
Everything free, plus the AI + depth that beats Emma:

- **Unlimited** bank + card connections
- **Full Fixable-Problems wedge** — all detected duplicate subs, price rises, overspend, with savings totals
- **Ask Genwel** — the conversational AI agent over your real data *(ships when built)*
- **AI insights** — personalized, beyond the free category view
- **Monthly budgets** with AI-suggested limits
- Custom categories + rules
- Recurring/subscription detection + tracking
- Full history + trends (beyond current month)
- Data export

**7-day free trial** on Pro. Annual default-selected on the paywall (anchoring).

### Why these numbers
- **£6.99/mo** undercuts Emma Pro (£9.99) by 30% while bundling AI Emma lacks — a clear "more for less" story. Sits comfortably in the verified £4.99–£14.99 band, at the value-conscious end where a challenger should enter.
- **£54.99/yr** = £4.58/mo effective, a **34% annual discount** — slightly deeper than the market's 25–30% to drive annual commitment (better LTV, lower churn) at launch.
- **Charm pricing (£6.99, £54.99)** — value-focused, matches the category and the "affordable, smarter than Emma" position.
- **One paid tier, not three** — no Ultimate. Add a higher tier later only if usage data shows power users maxing Pro. Simplicity converts.

---

## 4. Paywall / pricing-page structure (for the Stripe build)

- Monthly/annual toggle, **annual pre-selected** with "Save 34%" badge.
- Two cards: Free (current plan) + Pro (highlighted, "Most popular").
- 5–6 benefit bullets on Pro, led by the AI differentiators (Ask Genwel, full wedge).
- Single bold CTA: **"Start 7-day free trial"**.
- Trust line: "Cancel anytime · Bank-grade security · Not financial advice."
- The Fixable-Problems card is the natural in-app upgrade trigger: free users see "1 of N problems — unlock the rest with Pro."

---

## 5. What this means for the Stripe build (next phase)

- **2 Stripe Prices** under one Product: `pro_monthly` (£6.99) + `pro_annual` (£54.99), 7-day trial on both.
- **DB is source of truth** (matches your other apps): subscription status + tier on the `User` (or a `Subscription` model), synced via Stripe webhooks. This is the same shape RevenueCat will later mirror on mobile.
- Feature gates read from the DB tier, not from Stripe directly.
- Free tier = the default; no card required until upgrade.

---

## 6. Decisions — all confirmed 2026-07-11

1. Pro price: **£6.99/mo** ✅
2. Annual: **£54.99/yr (34% off)** ✅
3. Free-tier bank limit: **2** ✅
4. Tiers: **1 paid tier (Free + Pro)**, no Ultimate ✅

Proceeding to the Stripe build (see §5).
