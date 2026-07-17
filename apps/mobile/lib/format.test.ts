import { describe, expect, it } from 'vitest';
import { categoryLabel, compactMoney, money } from './format';

describe('money', () => {
  it('formats GBP with pence by default', () => {
    expect(money(1234.5)).toBe('£1,234.50');
  });

  it('drops pence when decimals is false', () => {
    expect(money(1234.5, 'GBP', false)).toBe('£1,235');
  });

  it('respects an explicit currency', () => {
    expect(money(10, 'USD')).toBe('US$10.00');
  });
});

describe('compactMoney', () => {
  it('abbreviates thousands and millions', () => {
    expect(compactMoney(1500)).toBe('£1.5k');
    expect(compactMoney(2_300_000)).toBe('£2.3m');
  });

  it('keeps small amounts un-abbreviated (whole pounds)', () => {
    expect(compactMoney(999)).toBe('£999');
  });

  it('abbreviates negatives by absolute magnitude', () => {
    expect(compactMoney(-1500)).toBe('£-1.5k');
  });
});

describe('categoryLabel', () => {
  it('title-cases snake_cased spending categories', () => {
    expect(categoryLabel('EATING_OUT')).toBe('Eating Out');
    expect(categoryLabel('groceries')).toBe('Groceries');
  });
});
