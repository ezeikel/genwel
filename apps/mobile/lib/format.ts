import type { SpendingCategory } from '@/lib/types';

export const money = (value: number, currency = 'GBP', decimals = true) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);

export const compactMoney = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}m`;
  if (absolute >= 1_000) return `£${(value / 1_000).toFixed(1)}k`;
  return money(value, 'GBP', false);
};

export const categoryLabel = (category: SpendingCategory | string) =>
  category
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const shortDate = (value: string | Date) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));

export const relativeDate = (value: string | null) => {
  if (!value) return 'Not synced yet';
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(delta / 60_000));
  if (minutes < 1) return 'Updated now';
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.round(hours / 24)}d ago`;
};

export const initials = (name: string | null, email: string | null) => {
  const value = name?.trim() || email?.split('@')[0] || 'G';
  const parts = value.split(/\s+/).filter(Boolean);
  return (
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : value.slice(0, 2)
  ).toUpperCase();
};
