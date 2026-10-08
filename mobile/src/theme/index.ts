import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

/**
 * Mobile Design System Theme (PRD §12.3)
 * Maps shared design tokens to React Native Paper MD3 specifications.
 */

export const colors = {
  primary: '#2563EB',
  primaryContainer: '#DBEAFE',
  onPrimary: '#FFFFFF',
  secondary: '#F1F5F9',
  secondaryContainer: '#E2E8F0',
  onSecondary: '#0F172A',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  onSurface: '#0F172A',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#475569',
  outline: '#E2E8F0',
  error: '#DC2626',
  // Status Colors (§12.3)
  status: {
    notStarted: '#64748B',
    inProgress: '#D97706',
    completed: '#16A34A',
  },
  // Priority Colors (§12.3)
  priority: {
    low: '#0284C7',
    medium: '#D97706',
    high: '#DC2626',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryContainer,
    onPrimary: colors.onPrimary,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryContainer,
    onSecondary: colors.onSecondary,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.onSurface,
    surfaceVariant: colors.surfaceVariant,
    onSurfaceVariant: colors.onSurfaceVariant,
    outline: colors.outline,
    error: colors.error,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3B82F6',
    primaryContainer: '#1E3A8A',
    onPrimary: '#FFFFFF',
    background: '#0F172A',
    surface: '#1E293B',
    onSurface: '#F8FAFC',
    surfaceVariant: '#334155',
    onSurfaceVariant: '#94A3B8',
    outline: '#334155',
  },
};
