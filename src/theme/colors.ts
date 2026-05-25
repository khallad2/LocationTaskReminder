/**
 * Color Tokens — Derived from Stitch "Precision Task" design system.
 * Material Design 3 inspired palette.
 */
export const Colors = {
  // ── Primary ──
  primary: '#004AC6',
  primaryContainer: '#D9E2FF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#001946',

  // ── Secondary (Emerald for proximity) ──
  secondary: '#006C49',
  secondaryContainer: '#6CF8BB',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#002114',

  // ── Tertiary (Warm alerts) ──
  tertiary: '#943700',
  tertiaryContainer: '#FFDBC8',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#321200',

  // ── Error ──
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onError: '#FFFFFF',
  onErrorContainer: '#410002',

  // ── Surfaces ──
  surface: '#FAF8FF',
  surfaceContainer: '#EAEDFF',
  surfaceContainerLow: '#F3F3FA',
  surfaceContainerHigh: '#E2E2EF',
  surfaceDim: '#D9D9E5',
  onSurface: '#131B2E',
  onSurfaceVariant: '#434655',

  // ── Outline ──
  outline: '#737686',
  outlineVariant: '#C3C5D4',

  // ── Inverse ──
  inverseSurface: '#2E3041',
  inverseOnSurface: '#F0F0FC',
  inversePrimary: '#B0C6FF',

  // ── Status Badges ──
  nearbyBg: 'rgba(0, 108, 73, 0.10)',
  nearbyText: '#006C49',
  warningBg: 'rgba(148, 55, 0, 0.10)',
  warningText: '#943700',

  // ── Category Tints ──
  grocery: '#006C49',
  personal: '#004AC6',
  routine: '#6750A4',
  work: '#943700',

  // ── Background ──
  background: '#FAF8FF',
  scrim: '#000000',

  // ── Shadows ──
  shadowColor: 'rgba(0, 0, 0, 0.08)',
} as const;

export type ColorToken = keyof typeof Colors;
