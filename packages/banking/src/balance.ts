/**
 * Account balance helpers.
 *
 * A credit card's `balance` is stored POSITIVE = the amount OWED, because
 * that's what TrueLayer's card balance `current` field returns (see the card
 * write path in the connect callback + sync). The DB deliberately keeps the raw
 * TrueLayer value. For NET-WORTH maths a card is a liability, so the sign is
 * flipped here at read time — this helper is the single chokepoint that keeps
 * the sign decision in one place.
 */

/** Account types that represent money owed rather than money held. */
export function isLiabilityAccount(accountType: string): boolean {
  return accountType === 'credit_card';
}

/**
 * Balance signed for net-worth: assets positive, liabilities (credit cards)
 * negative. Route every "sum of balances" through this.
 */
export function signedBalance(accountType: string, balance: number): number {
  return isLiabilityAccount(accountType) ? -Math.abs(balance) : balance;
}
