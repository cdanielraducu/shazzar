export const colors = {
  bg:           '#0e0d0b',
  surface1:     '#1c1a16',
  surface2:     '#2a2620',
  surface3:     '#141210',
  surfaceHover: '#36312a',

  fg1: '#f0ece4',
  fg2: '#d6cfbe',
  fg3: '#bdb090',
  fg4: '#a09070',
  fg5: '#6e6050',
  fg6: '#5a5040',

  border:       '#2a2620',
  borderActive: '#5a5040',

  accent:       '#c87055',
  accentHover:  '#d98060',
  accentDim:    '#7a3520',
  accentBg:     '#1e0c08',
  accentMuted:  '#3a1a10',

  danger:       '#ff6b6b',
  dangerBg:     '#1a0a0a',
  dangerBorder: '#3a1a1a',

  terminal: '#51cf66',
} as const;

// Use explicit font family names — both iOS and Android resolve by PostScript/filename.
export const font = {
  regular:  'Outfit-Regular',
  light:    'Outfit-Light',
  medium:   'Outfit-Medium',
  semibold: 'Outfit-SemiBold',
  bold:     'Outfit-Bold',
} as const;

export const fontSize = {
  micro:   10,
  label:   11,
  mono:    12,
  sm:      13,
  body:    14,
  bodyLg:  15,
  value:   16,
  time:    22,
  heading: 26,
  display: 28,
} as const;

export const letterSpacing = {
  tight:  0,
  base:   0.5,
  wide:   1,
  wider:  2,
} as const;

export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  15: 60,

  screenH:    24,
  screenV:    60,
  itemGap:    8,
  sectionGap: 24,
  cardH:      16,
  cardV:      14,
} as const;

export const radius = {
  default: 8,
  sm:      6,
} as const;
