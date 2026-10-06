/**
 * A player's shirt (canvas P23 and N-koszulka): a pattern in two colours and a number. It is
 * the player's sign in rankings, lists and the profile; on the table everyone plays in the
 * team's colours. Players without a kit keep their initials.
 */
export const KIT_PATTERNS = ['plain', 'stripes', 'hoops', 'halves', 'sash', 'quarters'] as const;
export type KitPattern = (typeof KIT_PATTERNS)[number];

/** The palette, by the names stored in the database (the rules accept only these). */
export const KIT_COLORS = {
  yellow: '#ffc629',
  white: '#ffffff',
  black: '#1a1a1a',
  red: '#d62b2b',
  blue: '#1f55d0',
  green: '#1e8c4e',
  maroon: '#7a1f3d',
  orange: '#f28c28',
} as const;
export type KitColor = keyof typeof KIT_COLORS;
export const KIT_COLOR_NAMES = Object.keys(KIT_COLORS) as KitColor[];

export interface Kit {
  pattern: KitPattern;
  /** The main colour, also of the socks. */
  c1: KitColor;
  /** The second colour, of the pattern and the shorts. */
  c2: KitColor;
  /** 1 to 99; without it the shirt has no number. */
  num?: number;
}

/** A first kit to start the editor from. */
export const NEW_KIT: Kit = { pattern: 'halves', c1: 'yellow', c2: 'blue', num: 9 };

/** The kit stored on a player, or `null` when there is none or it is not one we can draw. */
export function kitOf(value: unknown): Kit | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const { pattern, c1, c2, num } = value as Record<string, unknown>;
  const color = (c: unknown): c is KitColor => typeof c === 'string' && c in KIT_COLORS;
  if (!KIT_PATTERNS.includes(pattern as KitPattern) || !color(c1) || !color(c2)) {
    return null;
  }
  const kit: Kit = { pattern: pattern as KitPattern, c1, c2 };
  if (typeof num === 'number' && Number.isInteger(num) && num >= 1 && num <= 99) {
    kit.num = num;
  }
  return kit;
}
