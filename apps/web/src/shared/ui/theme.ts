export const palette = {
  primary: '#0A84FF',
  primaryDark: '#001F3F',
  background: '#030712',
  surface: 'rgba(15, 23, 42, 0.55)',
  border: 'rgba(255, 255, 255, 0.16)',
  accentSoft: 'rgba(56, 189, 248, 0.18)',
  accentMuted: 'rgba(125, 211, 252, 0.35)',
  textPrimary: '#F8FAFC',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassHover: 'rgba(255, 255, 255, 0.16)',
  glassBorder: 'rgba(148, 163, 184, 0.22)',
  glowPrimary: '#38BDF8',
  glowSecondary: '#818CF8'
} as const;

export const typography = {
  fontFamily: "'Onest', 'Inter', 'Segoe UI', 'Roboto', sans-serif",
  accentFamily: "'Inter', 'Onest', 'Segoe UI', 'Roboto', sans-serif",
  headingWeight: 600,
  bodyWeight: 400,
  monospace: "'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
} as const;

export const layout = {
  pageMaxWidth: 1280,
  sidebarWidth: 240,
  headerHeight: 64,
  cornerRadius: 16
} as const;

export const gradients = {
  app: 'linear-gradient(135deg, #030712 0%, #0F172A 40%, #1E3A8A 70%, #6D28D9 100%)',
  glassHighlight: 'linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(99, 102, 241, 0.55) 100%)',
  button: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)'
} as const;
