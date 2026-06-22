/**
 * Merchant identity derivation.
 *
 * TrueLayer's mock provider (and many real banks) return a NULL merchant_name,
 * so we derive a stable merchant key from the transaction description. Real
 * bank descriptions are noisy — card-number suffixes, payment refs, dates,
 * POS prefixes — so we strip the noise down to a comparable merchant name.
 *
 * Two outputs:
 * - `displayMerchant`: human-readable, title-cased (e.g. "Amazon Prime")
 * - `merchantKey`: lowercased canonical key for grouping/caching/dup-detection
 */

// Tokens that are bank-operation noise, not merchant identity.
const NOISE_PREFIXES = [
  'direct debit payment to',
  'direct debit',
  'outgoing dd',
  'returned direct debit',
  'returned dd',
  'standing order',
  'faster payment',
  'card payment to',
  'card payment',
  'pos',
  'contactless',
  'payment to',
  'bill payment',
  'transfer to',
  'transfer from',
];

// Legal/entity suffixes to drop from the canonical key so "TESCO" and
// "TESCO LTD" group together.
const LEGAL_SUFFIXES = [
  'ltd',
  'limited',
  'lim',
  'plc',
  'llp',
  'inc',
  'co',
  'uk',
  'intl',
  "int'l",
];

function stripDiacritics(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

/**
 * Reduce a raw bank description to a canonical merchant string (still upper
 * case, noise removed). Shared by both display and key derivation.
 */
function canonicalize(description: string): string {
  let s = stripDiacritics(description).toUpperCase();

  // Strip a leading hex/numeric reference token (e.g. "18DB38 Betropolis").
  s = s.replace(/^[0-9A-F]{4,}\s+/i, '');

  // Strip trailing card markers: "CD 0315", "*1234", "XXXX1234".
  s = s.replace(/\s+CD\s*\d{2,}$/i, '');
  s = s.replace(/\s*\*+\d{2,}$/i, '');
  s = s.replace(/\s+X{2,}\d{2,}$/i, '');

  // Strip trailing standalone reference numbers/dates.
  s = s.replace(/\s+\d{2}[/-]\d{2}([/-]\d{2,4})?$/i, ''); // dates
  s = s.replace(/\s+(REF|REFERENCE|MANDATE)\b.*$/i, '');

  // Strip common web/TLD suffixes so "NETFLIX.COM" groups with "NETFLIX".
  s = s.replace(/\.(COM|CO\.UK|CO|NET|ORG|IO|UK)\b/gi, '');

  // Remove known noise prefixes (longest first).
  const lower = s.toLowerCase();
  for (const prefix of NOISE_PREFIXES.slice().sort(
    (a, b) => b.length - a.length,
  )) {
    if (lower.startsWith(prefix)) {
      s = s.slice(prefix.length);
      break;
    }
  }

  // Collapse whitespace and trim stray punctuation.
  s = s
    .replace(/[^A-Z0-9'&.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return s;
}

/** Lowercased canonical key for grouping/caching. Legal suffixes removed. */
export function getMerchantKey(description: string): string {
  const canonical = canonicalize(description).toLowerCase();
  if (!canonical) return '';

  const words = canonical.split(' ').filter(Boolean);

  // Drop trailing legal suffixes (e.g. "tesco mobile ltd" -> "tesco mobile").
  while (words.length > 1) {
    const last = words[words.length - 1].replace(/[.'&-]/g, '');
    if (LEGAL_SUFFIXES.includes(last)) {
      words.pop();
    } else {
      break;
    }
  }

  return words.join(' ');
}

/** Human-readable, title-cased merchant name for display. */
export function getDisplayMerchant(description: string): string {
  const canonical = canonicalize(description);
  if (!canonical) return description.trim();

  return canonical
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (!word) return word;
      // Keep short all-caps acronyms (AA, DVLA, NHS) uppercase.
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Resolve the best merchant identity for a transaction, preferring the
 * bank-provided merchantName and falling back to the derived key/display.
 */
export function resolveMerchant(
  merchantName: string | null | undefined,
  description: string,
): { key: string; display: string } {
  if (merchantName && merchantName.trim()) {
    return {
      key: getMerchantKey(merchantName),
      display: merchantName.trim(),
    };
  }
  return {
    key: getMerchantKey(description),
    display: getDisplayMerchant(description),
  };
}
