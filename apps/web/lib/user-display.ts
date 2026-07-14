/**
 * Friendly user display helpers — turn a next-auth user (which often has no
 * `name`, just an email) into a decent display name + initials for the avatar,
 * the way Emma/Monzo/Revolut do it (initials in a tinted circle).
 */

/** Title-case a lowercased token: "ezeikel" -> "Ezeikel". */
function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Best available human name. Prefers the real name; otherwise derives one from
 * the email local-part ("ezeikelpemberton" / "jane.doe" -> "Ezeikel" / "Jane").
 * Never returns the literal "User" unless there's truly nothing to work with.
 */
export function displayName(
  name?: string | null,
  email?: string | null,
): string {
  if (name?.trim()) return name.trim();
  const local = email?.split('@')[0];
  if (local) {
    // split on separators; if none, take the whole local part.
    const first = local.split(/[._-]/)[0];
    return titleCase(first);
  }
  return 'there';
}

/**
 * Up to two initials for the avatar. From a real name ("Ezeikel Pemberton" ->
 * "EP"), or from an email ("ezeikelpemberton@..." -> "EP" if we can split, else
 * the first two letters "EZ"), else "?".
 */
export function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }
  const local = email?.split('@')[0];
  if (local) {
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }
  return '?';
}
