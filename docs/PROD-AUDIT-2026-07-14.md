# Genwel Web — Production Reality Audit (2026-07-14)

Audited the **live logged-in experience** on `www.genwel.com` with the real user's
real NatWest data + the production DB. This is what a real customer actually gets today.

## Bottom line
The product is **real and mostly works** — real bank connections sync, the dashboard renders
genuine data, the UI is premium. But there are **two launch-blocking bugs** and a **flagship-feature
data-quality problem** that make it not-yet-ready to charge strangers.

---

## 🔴 BLOCKER 1 — Nobody can actually become Pro (billing is dead in prod)
Production DB facts (`subscriptions`, `users`, `webhook_events` tables):
- `subscriptions`: **0 rows**
- `users` with a `stripeCustomerId`: **0**
- `webhook_events`: **0 ever received**
- The audited user (only user in prod) has `stripeCustomerId = NULL`, no subscription row → shown as **FREE** everywhere despite "having paid".

**Meaning:** the Stripe webhook — the *sole writer* of the entitlement table — has **never fired against production**. Any real customer who pays at Stripe checkout is charged and gets **nothing**. Likely causes: webhook endpoint not registered in the **live** Stripe dashboard (only test mode), or `STRIPE_WEBHOOK_SECRET` mismatch, or the prior "successful checkout" was on localhost/test-mode.

**Fix:** register `https://www.genwel.com/api/stripe/webhook` in the **live** Stripe dashboard, confirm `STRIPE_SECRET_KEY` is `sk_live_` and `STRIPE_WEBHOOK_SECRET` matches the live endpoint, then do a real end-to-end checkout and confirm a `subscriptions` row + `webhook_events` row appear. This is #1 — until it's fixed, the business cannot earn.

---

## 🔴 BLOCKER 2 — Subscriptions feature (the flagship) reports garbage
Overview + `/subscriptions` claim **"18 recurring · £6,367.30/mo · £76,408/yr"**. That number is
inflated by ~£5,400 of things that are **not subscriptions**. Root cause: the recurring-detection
engine is including **personal Faster Payments and bills** and trusting an unreliable `aiCategory`.

Concrete garbage shown to the user:
| Shown as subscription | What it really is | Amount | Raw description |
|---|---|---|---|
| **Chukwudumebi Okuremortgage** (up £300, "check you're on the best deal") | Monthly transfer to a **person** (landlord) | £1,600 | `CHUKWUDUMEBI OKUREMORTGAGE VIA MOBILE - PYMT FP` |
| **School Fee Plan** | School fees | £3,463 | `SCHOOL FEE PLAN` |
| **Sharon Rowe Car** | Transfer to a person | £200 | `SHARON ROWE CAR VIA MOBILE - PYMT FP` |
| **Lb Lewisham** | Council tax | £166 | `LB LEWISHAM` |
| **Access 1 Direct** | Loan/finance | £120 | — |
| **British Gas** + **Bg Services** | Same company, **counted twice** | £220 + £27 | — |

Why the existing exclusions (`lib/subscriptions.ts` excludes TRANSFER/CASH/INCOME…) don't catch these:
1. **`aiCategory` is inconsistent** — the *same* payee "OKUREMORTGAGE" is tagged `BILLS` one month and `TRANSFER` another; "SHARON ROWE CAR" flips `TRANSPORT`/`OTHER`/`TRANSFER`. The filter trusts a category that's wrong.
2. **`...VIA MOBILE - PYMT FP...` = Faster Payment to an individual** — a strong signal these are P2P transfers, not merchants, and it's **not being used** to exclude them.
3. Merchant keys vary month to month (`OKUREMORTGAGE`, `OKURETV`, `OKUREJANBDAY` all "Chukwudumebi Okure…"), so dedupe/exclusion by merchant key is leaky.

Genuinely-correct detections (the feature *does* work when data is clean): British Gas, Vitality Health,
Admiral Insurance, Thames Water, MBNA, **Allwyn Ent Ltd up £4.50** (National Lottery — a real, useful catch), with real logos.

**Fix direction:** exclude `...PYMT FP...` / Faster-Payment-to-individual patterns; don't trust `aiCategory` alone for the transfer/bill exclusion — add description-pattern gates (mortgage/rent/school/council/loan/"CAR"/person-name heuristics); dedupe British Gas vs "BG Services"; consider a hard cap or "bills vs subscriptions" split so a £3,463 school fee never headlines a "subscriptions" total. **Calling a customer's mortgage a subscription that "went up, check your deal" is a credibility-killer.**

---

## 🟠 MEDIUM issues
- **Insights chart Y-axis labels all read `000.00`** instead of `£2k/£4k/£6k/£8k` — looks unfinished/broken. Axis tick formatter is wrong.
- **Magic-link users have no name** (`users.name = NULL`) → avatar shows email-derived initials only. Cosmetic; capture a name at/after signup.
- **AI categorization is unreliable on P2P payments** (same payee, different category each month). Feeds Blocker 2. Worth a deterministic override layer for FP/transfer patterns before trusting the model.

---

## ✅ What genuinely works (real value today)
- **Real bank connect + sync**: NatWest current accounts, savings, and Mastercard debt all live; "Updated 2 min ago". TrueLayer prod is live.
- **Net worth** (−£2,167) with cash vs credit-card split donut, per-account breakdown, real merchant logos (British Gas, Thames Water).
- **Overview AI insight** is genuinely good and specific ("card balance £2,164 far higher than £-2 spendable…").
- **Fixable Problems** framing/UX is strong (potential-savings badge, Pro teaser) — just fed by the same bad subscription data.
- Premium, coherent UI; floating glass mobile tab bar; compliant privacy/terms; no false FCA claims.

---

## Verdict
**Not yet ready to charge strangers — but close.** Two hard blockers before launch:
1. **Fix Stripe webhook in prod** (else paying customers get nothing) — highest priority.
2. **Fix subscription/recurring detection** (else the flagship feature looks broken and untrustworthy).
Then the Insights axis + name capture are quick polish. Everything else is real and shippable.

---

## UPDATE 2026-07-14 — both blockers RESOLVED

**Blocker 1 (billing): resolved — was never a code bug.** Completed a real live-mode
checkout on www.genwel.com with promo `GENWELTEAM` (100% off). Verified the full chain end-to-end:
live webhook fired, `subscriptions` row written (TRIALING/PRO/ANNUAL), `stripeCustomerId` backfilled,
UI flipped to Pro. The earlier "0 subscriptions / 0 webhooks" was simply that **no real live payment
had ever happened** (prior test checkout ran in Stripe sandbox). Live prices £6.99/£54.99 + live
webhook endpoint are correctly configured. Commit: verified live, no code change needed.

**Blocker 2 (subscriptions): resolved.** Rewrote recurring detection (`lib/subscriptions.ts`, commit
`32e7a10`), validated against real prod data: **£6,367→£848/mo, 12 genuine subs**, all garbage gone
(mortgage/rent to individuals, school fees, council tax, savings, car finance, App Store noise).
Changes: exclude personal/own-account transfers by raw description (VIA MOBILE / PYMT FP / To A/C),
not the unreliable aiCategory; keyword-exclude loans/tax/council/mortgage/school-fees/savings;
collapse same-day split charges (L&G, 1Life); require a REGULAR cadence (most gaps in one bucket),
not just a median — which kills PayPal/App Store aggregators.

**Remaining = polish, not blockers:** Insights chart Y-axis reads `000.00` (tick formatter);
magic-link users have no name (avatar falls back to email initials). Both cosmetic.
