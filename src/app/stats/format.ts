import { Game, lineupPlayers, TeamColor, teamScore } from '../game/game';

/** Whole hours and the minutes left, for "12 h 5 min". */
export function hoursAndMinutes(seconds: number): { h: number; m: number } {
  const minutes = Math.round(seconds / 60);
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}

/** The score, the winners first ("8:6"). */
export function scoreOf(game: Game): string {
  const [first, second] = order(game);
  return `${teamScore(game, first)}:${teamScore(game, second)}`;
}

/** The winners first, so a record reads "8:0" and never "0:8"; red first without a winner. */
function order(game: Game): [TeamColor, TeamColor] {
  return game.win === 'blue' ? ['blue', 'red'] : ['red', 'blue'];
}

/** "Ala & Bartek – Celina & Darek", the winners first. */
export function sidesOf(game: Game, name: (playerId: string) => string): string {
  const team = (color: TeamColor) => lineupPlayers(game.teams[color]).map(name).join(' & ');
  const [first, second] = order(game);
  return `${team(first)} – ${team(second)}`;
}

/** Whole percentages of the counts that add up to 100 (largest remainders get the rest). */
export function percentages(counts: readonly number[]): number[] {
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (!total) {
    return counts.map(() => 0);
  }
  const exact = counts.map((n) => (n / total) * 100);
  const shares = exact.map(Math.floor);
  const order = exact
    .map((value, i) => ({ i, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest);
  const missing = 100 - shares.reduce((sum, n) => sum + n, 0);
  for (let k = 0; k < missing; k++) {
    shares[order[k].i]++;
  }
  return shares;
}

/** A duration in words' keys: "7 min 15 s", "1 h 2 min", "45 s" (`duration.*` texts). */
export function spokenDuration(seconds: number): { key: string; params: Record<string, number> } {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) {
    return { key: 'duration.hm', params: { h, m } };
  }
  return m ? { key: 'duration.ms', params: { m, s } } : { key: 'duration.s', params: { s } };
}
