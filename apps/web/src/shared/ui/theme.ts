export const palette = {
  primary: '#2962FF',
  primaryDark: '#131A2D',
  background: '#F5F7FF',
  surface: '#FFFFFF',
  border: '#E3E9FF',
  accentSoft: '#E6EDFF',
  accentMuted: '#D2DCFF',
  textPrimary: '#131A2D',
  textSecondary: '#475569',
  textMuted: '#94A3B8'
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
