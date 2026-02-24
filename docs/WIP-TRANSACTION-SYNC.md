# WIP: Transaction Sync + Auto-Categorization

## Goal

TrueLayer mock bank is connected (5 accounts, valid refresh token), but **0 transactions in the DB**. Dashboard pages query the DB directly but never invoke the sync logic. AI categorization (`aiCategory`) is also never auto-triggered, so budgets/insights have no data.

## What's been done

### 1. Created `lib/banking/sync.ts`

Extracted a standalone `syncUserTransactions(userId)` function that:
- Gets all bank accounts for the user
- Refreshes expired TrueLayer tokens
- Fetches transactions from TrueLayer (last 90 days)
- Upserts into DB
- Returns count of synced transactions

This is a **plain utility file** (no `"use server"` directive) — critical for avoiding the RSC serialization crash (see Known Issues below).

### 2. Created `lib/banking/categorize.ts`

Extracted `categorizeUserTransactions(userId)` — same logic as the server action in `actions/ai-budgets.ts` but:
- Takes `userId` directly (no `auth()` call)
- No `revalidatePath` (avoids server action coupling)
- Plain utility, safe to call from server components

### 3. Wired sync + categorize into dashboard pages

| Page | File | Sync | Categorize |
|------|------|------|------------|
| Dashboard overview | `app/dashboard/page.tsx` | Yes | No |
| Transactions | `app/dashboard/transactions/page.tsx` | Yes | No |
| Budgets | `app/dashboard/budgets/page.tsx` | Yes | Yes |
| Insights | `app/dashboard/insights/page.tsx` | Yes | Yes |

All calls happen after auth check, before DB queries.

## Known Issues / What still needs fixing

### 1. App freezes on page load (BLOCKING)

The sync + categorize calls are **awaited** in server components, meaning the page won't render until they complete. With the Gemini free tier (5 req/min) and ~200 uncategorized transactions, categorization alone takes **60+ seconds** blocking page render.

**Possible fixes (pick one):**
- **A) Fire-and-forget categorization** — Don't `await` the categorize call. Page renders immediately with uncategorized data; categories fill in on next visit.
- **B) Move to a background job** — Trigger categorization via an API route or cron, not inline during page render.
- **C) Upgrade Gemini API tier** — Paid tier has much higher rate limits, so categorization completes in seconds.
- **D) Reduce batch size / add throttling** — Process fewer transactions per page load (e.g., limit to 1 batch of 20, skip the rest until next visit).

Option A is the simplest immediate fix. Just change `await categorizeUserTransactions(...)` to a fire-and-forget:
```ts
categorizeUserTransactions(session.user.id).catch(console.error);
```

### 2. RSC serialization crash (FIXED)

`Maximum call stack size exceeded` in `visitAsyncNode` — caused by importing functions from `"use server"` files into server components. Prisma models with `include: { connection: true }` have deep/circular references that blow the RSC serializer's stack.

**Fix applied:** Moved utility functions to plain `lib/` files (no `"use server"` directive). Server action files are reserved for functions called from client components only.

### 3. Gemini API rate limiting (429 errors)

Free tier limit: 5 requests/minute. With BATCH_SIZE=20 and ~200 transactions, that's 10 batches = 10 API calls, all exceeding the limit. The error handler catches these gracefully (logs and skips), but it means most transactions don't get categorized on first pass.

**Current behavior:** Categorization is incremental — already-categorized transactions are skipped on repeat visits, and the merchant cache means similar transactions are categorized without AI calls.

## Files changed

| File | Status | Description |
|------|--------|-------------|
| `apps/web/lib/banking/sync.ts` | **New** | `syncUserTransactions()` utility |
| `apps/web/lib/banking/categorize.ts` | **New** | `categorizeUserTransactions()` utility |
| `apps/web/app/dashboard/page.tsx` | Modified | Calls sync before DB queries |
| `apps/web/app/dashboard/transactions/page.tsx` | Modified | Calls sync before DB queries |
| `apps/web/app/dashboard/budgets/page.tsx` | Modified | Calls sync + categorize |
| `apps/web/app/dashboard/insights/page.tsx` | Modified | Calls sync + categorize |
| `actions/banking.ts` | Unchanged | Sync function was added then moved to lib/ |

## Next steps

1. **Fix the page freeze** — Apply option A (fire-and-forget categorize) or option D (limit to 1 batch per page load)
2. **Test locally** — Visit `/dashboard/transactions` and confirm transactions appear from mock bank
3. **Verify categorization** — Visit `/dashboard/budgets` a couple of times; `aiCategory` values should fill in incrementally
4. **Consider adding sync staleness check** — Currently sync runs on every page load; could skip if last sync was < 5 minutes ago (check `lastSyncedAt` on BankConnection)
