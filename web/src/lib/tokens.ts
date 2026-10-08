/**
 * PMS Shared Design Tokens (PRD §12.3)
 * These tokens are the single source of truth for Web and Mobile themes.
 */

export const colors = {
  primary: {
    DEFAULT: '#2563EB',
    hover: '#1D4ED8',
    foreground: '#FFFFFF',
    dark: '#3B82F6',
  },
  secondary: {
    DEFAULT: '#F1F5F9',
    foreground: '#0F172A',
    dark: '#1E293B',
    darkForeground: '#F8FAFC',
  },
  status: {
    notStarted: '#64748B', // Slate 500
    inProgress: '#D97706', // Amber 600
    completed: '#16A34A',  // Emerald 600
  },
  priority: {
    low: '#0284C7',        // Sky 600
    medium: '#D97706',     // Amber 600
    high: '#DC2626',       // Red 600
  },
  neutral: {
    background: '#F8FAFC',
    foreground: '#0F172A',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    muted: '#64748B',
    darkBackground: '#0F172A',
    darkSurface: '#1E293B',
    darkBorder: '#334155',
    darkMuted: '#94A3B8',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 32,
  },
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
  },
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;
