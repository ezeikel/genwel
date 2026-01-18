// Vercel Analytics property cleaner - only allows string, number, boolean, null
type CleanPropertyValue = string | number | boolean | null;

export function cleanVercelProperties(
  properties: Record<string, unknown>
): Record<string, CleanPropertyValue> {
  const cleaned: Record<string, CleanPropertyValue> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      cleaned[key] = value;
    } else if (value !== undefined) {
      // Convert other types to string
      cleaned[key] = String(value);
    }
  }

  return cleaned;
}
