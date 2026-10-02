export type TeamColor = 'red' | 'blue';
export type Position = 'defence' | 'offence';

export const TEAM_COLORS: readonly TeamColor[] = ['red', 'blue'];
export const POSITIONS: readonly Position[] = ['offence', 'defence'];
export const TARGET_SCORE = 8;

export interface PlayerScore {
  player: string;
  goals: number;
  ownGoals: number;
}

export type Team = Record<Position, PlayerScore>;

export interface Game {
  id: string;
  /** Distinct ids of everyone playing, used for `array-contains` queries. */
  players: string[];
  start: string;
  end?: string;
  win?: TeamColor;
  teams: Record<TeamColor, Team>;
}

export function opponent(color: TeamColor): TeamColor {
  return color === 'red' ? 'blue' : 'red';
}

/** Goals credited to a team: its own goals plus the opponent's own goals. */
export function teamScore(game: Pick<Game, 'teams'>, color: TeamColor): number {
  const team = game.teams[color];
  const other = game.teams[opponent(color)];
  return team.defence.goals + team.offence.goals + other.defence.ownGoals + other.offence.ownGoals;
}

export function winnerOf(game: Pick<Game, 'teams'>): TeamColor | undefined {
  return TEAM_COLORS.find((color) => teamScore(game, color) >= TARGET_SCORE);
}

/** Distinct player ids of a team (a single id when one player covers both positions). */
export function teamPlayers(team: Team): string[] {
  return team.defence.player === team.offence.player
    ? [team.defence.player]
    : [team.defence.player, team.offence.player];
}

export function teamOf(game: Pick<Game, 'teams'>, playerId: string): TeamColor | undefined {
  return TEAM_COLORS.find((color) => teamPlayers(game.teams[color]).includes(playerId));
}

/** Formats a number of seconds as `mm:ss`. */
export function formatDuration(totalSeconds: number): string {
  const time = Math.max(0, Math.floor(totalSeconds));
  const seconds = time % 60;
  const minutes = (time - seconds) / 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
