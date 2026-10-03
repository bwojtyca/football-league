import { Game, lineupPlayers, TeamColor, teamScore } from '../game/game';

/** Whole hours and the minutes left, for "12 h 5 min". */
export function hoursAndMinutes(seconds: number): { h: number; m: number } {
  const minutes = Math.round(seconds / 60);
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}

/** The score as "red:blue". */
export function scoreOf(game: Game): string {
  return `${teamScore(game, 'red')}:${teamScore(game, 'blue')}`;
}

/** "Ala & Bartek – Celina & Darek". */
export function sidesOf(game: Game, name: (playerId: string) => string): string {
  const team = (color: TeamColor) => lineupPlayers(game.teams[color]).map(name).join(' & ');
  return `${team('red')} – ${team('blue')}`;
}
