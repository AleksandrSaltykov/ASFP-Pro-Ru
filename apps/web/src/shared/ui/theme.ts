﻿export const palette = {
  primary: 'var(--color-primary)',
  primaryDark: 'var(--color-primary-dark)',
  background: 'var(--color-background)',
  surface: 'var(--color-surface)',
  surfaceMuted: 'var(--color-surface-muted)',
  layer: 'var(--color-layer)',
  layerStrong: 'var(--color-layer-strong)',
  border: 'var(--color-border)',
  accentSoft: 'var(--color-accent-soft)',
  accentMuted: 'var(--color-accent-muted)',
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)',
  textSoft: 'var(--color-text-soft)',
  textSubtle: 'var(--color-text-subtle)',
  glass: 'var(--color-glass)',
  glassHover: 'var(--color-glass-hover)',
  glassBorder: 'var(--color-glass-border)',
  glowPrimary: 'var(--color-glow-primary)',
  glowSecondary: 'var(--color-glow-secondary)',
  shadowElevated: 'var(--shadow-elevated)'
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
  app: 'var(--gradient-app)',
  glassHighlight: 'var(--gradient-glass-highlight)',
  button: 'var(--gradient-button)'
} as const;
