/**
 * App color palette — Light Sky Blue primary (#87CEFA).
 * Replaces the former orange/amber accents for a cohesive blue theme.
 */
export const colors = {
  /** Main brand / hero backgrounds (was #FF6B35) */
  primary: '#87CEFA',
  /** Deeper sky blue — borders, pressed states */
  primaryDeep: '#5DADE2',
  /** Soft sky tint — surfaces */
  primaryMuted: '#E1F5FE',
  /** Selected pins, emphasis (was #FF9800) */
  accent: '#42A5F5',
  /** Map route polylines (was #FFC107 amber) */
  route: '#29B6F6',
  /** High-attention map markers (was #FF5722) */
  pinStrong: '#1E88E5',
  /** Highlights / “best” badges (was #FFD700) */
  highlight: '#90CAF9',
  /** Warning-style banner, offline legend (was orange) */
  attention: '#64B5F6',
} as const;
