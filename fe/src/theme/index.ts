// ============================================
// THEME — Tokens de diseño globales
// ============================================
export const theme = {
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#334155',
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f97316',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    brand: '#61DAFB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
} as const;
