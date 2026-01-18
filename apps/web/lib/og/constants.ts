// OG Image Dimensions (standard social media size)
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Brand Colors - Genwel teal/green palette
export const colors = {
  // Primary brand
  primary: '#1a5a5a',
  primaryLight: '#2a7a7a',
  primaryDark: '#0d3d3d',

  // Accent colors
  accent: '#4ecdc4',
  accentLight: '#7ed9d3',
  accentDark: '#2db3aa',

  // Warm accents
  gold: '#d4a574',
  goldLight: '#e6c9a8',

  // Text colors
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textMuted: '#6b6b6b',
  textLight: '#ffffff',

  // Background colors
  bgLight: '#f8fafa',
  bgCream: '#faf9f7',
  bgWhite: '#ffffff',
} as const;

// Pre-defined gradients
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
  tealToAccent: `linear-gradient(145deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
  lightBackground: `linear-gradient(145deg, ${colors.bgLight} 0%, ${colors.bgCream} 100%)`,
  warmGradient: `linear-gradient(135deg, ${colors.bgCream} 0%, #f5f0eb 50%, ${colors.bgLight} 100%)`,
} as const;

// Decorative accent bar colors (for visual interest)
export const accentColors = [
  colors.primary,
  colors.accent,
  colors.gold,
  colors.primaryLight,
  colors.accentLight,
] as const;

// Reusable styles
export const styles = {
  card: {
    backgroundColor: colors.bgWhite,
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(26, 90, 90, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  pill: {
    backgroundColor: `${colors.primary}15`,
    color: colors.primary,
    padding: '8px 16px',
    borderRadius: '100px',
    fontSize: '14px',
    fontWeight: 600,
  },
} as const;
