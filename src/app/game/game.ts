export type TeamColor = 'red' | 'blue';
export type Position = 'defence' | 'offence';

export const TEAM_COLORS: readonly TeamColor[] = ['red', 'blue'];
export const POSITIONS: readonly Position[] = ['offence', 'defence'];
export const TARGET_SCORE = 8;

/**
 * How a game is won. Games without a mode (all games from 2017) are played to 8.
 * - `target`: goals that win the game;
 * - `winBy: 2`: the winner needs a two-goal lead, so from (target - 1) all square the game
 *   goes on until someone leads by two (stage 2 games may also have a cap, `max`);
 * - `minutes`: time limit; when it runs out the team ahead wins, on a tie the next goal does.
 */
export interface GameMode {
  target: number;
  winBy?: number;
  max?: number;
  minutes?: number;
}

/** Games without a mode (2017 and early 2026): to 8, no lead needed, no clock. */
export const DEFAULT_MODE: GameMode = { target: TARGET_SCORE };

/** A new game unless the players choose otherwise: to 8 with a two-goal lead. */
export const NEW_GAME_MODE: GameMode = { target: TARGET_SCORE, winBy: 2 };

/** Targets and time limits offered when starting a game. */
export const TARGETS = [5, 8, 10] as const;
export const MINUTES = [3, 5, 7, 10] as const;

/** Whether a game's rules go without saying: no mode at all, or those of a new game. */
export function isDefaultMode(mode: GameMode | undefined): boolean {
  return !mode || (mode.target === TARGET_SCORE && mode.winBy === 2 && !mode.max && !mode.minutes);
}

/** A best-of series between the same two teams, which swap colours after each game. */
export interface Series {
  /** Id of the first game of the series. */
  id: string;
  bestOf: number;
  /** Number of this game in the series, from 1. */
  game: number;
}

/**
 * The rods (lines) of a team, from its own goal: the defender plays the goalkeeper and the
 * defenders, the attacker the midfielders and the forwards.
 */
export type Rod = 'goalie' | 'defence' | 'midfield' | 'attack';
export const RODS: Record<Position, readonly [Rod, Rod]> = {
  defence: ['goalie', 'defence'],
  offence: ['midfield', 'attack'],
};
/** Figures on each rod, numbered from 1 on the side of the team's handles. */
export const FIGURES: Record<Rod, number> = { goalie: 1, defence: 2, midfield: 5, attack: 3 };

/**
 * How much a goal tells, chosen on the game screen: the position (as always), the rod, or
 * the figure on the rod. One game can mix them.
 */
export type GoalDetail = 'position' | 'rod' | 'man';
export const GOAL_DETAILS: readonly GoalDetail[] = ['position', 'rod', 'man'];

/**
 * What happened in a game, in order; `at` is milliseconds since the start. A goal may tell
 * its rod and the figure on it (`man`, from 1), when it was entered in that detail.
 */
export type GameEvent =
  | {
      at: number;
      type: 'goal' | 'own';
      team: TeamColor;
      position: Position;
      player: string;
      rod?: Rod;
      man?: number;
    }
  | { at: number; type: 'swap'; team: TeamColor };

export interface PlayerScore {
  player: string;
  goals: number;
  ownGoals: number;
}

export type Team = Record<Position, PlayerScore>;

/** Player ids of a team; the same id twice when one player covers both positions. */
export interface Lineup {
  defence: string;
  offence: string;
}

export interface Game {
  id: string;
  /** League id; the games from 2017 have none and belong to the legacy league. */
  league?: string;
  /** Distinct ids of everyone playing, used for `array-contains` queries. */
  players: string[];
  start: string;
  end?: string;
  win?: TeamColor;
  teams: Record<TeamColor, Team>;
  /** Games from before October 2026 have no mode (played to 8), log or series. */
  mode?: GameMode;
  events?: GameEvent[];
  series?: Series;
  /** Id of the tournament the game was played in. */
  tournament?: string;
  /** Deleted games are left out everywhere; nothing is erased and they can be restored. */
  deleted?: boolean;
  /**
   * What the game was deleted with, `league:<id>` or `tournament:<id>`: restoring that brings
   * it back, while games deleted one by one before stay deleted.
   */
  deletedWith?: string;
  /** When the running game was paused (ISO time); absent while it is played. */
  paused?: string;
  /** Milliseconds spent in earlier pauses. */
  pausedFor?: number;
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

export function modeOf(game: Pick<Game, 'mode'>): GameMode {
  return game.mode ?? DEFAULT_MODE;
}

/** The team that has won on goals: the target with the needed lead, or the cap. */
export function winnerOf(game: Pick<Game, 'teams' | 'mode'>): TeamColor | undefined {
  const { target, winBy = 1, max } = modeOf(game);
  return TEAM_COLORS.find((color) => {
    const own = teamScore(game, color);
    const other = teamScore(game, opponent(color));
    return own >= target && (own - other >= winBy || (max !== undefined && own >= max));
  });
}

/** The team with more goals, if any. */
export function leaderOf(game: Pick<Game, 'teams'>): TeamColor | undefined {
  const red = teamScore(game, 'red');
  const blue = teamScore(game, 'blue');
  return red > blue ? 'red' : blue > red ? 'blue' : undefined;
}

/** Milliseconds of play: since the start, without pauses. */
export function playTime(game: Pick<Game, 'start' | 'paused' | 'pausedFor'>, now: number): number {
  const until = game.paused ? Date.parse(game.paused) : now;
  return Math.max(0, until - Date.parse(game.start) - (game.pausedFor ?? 0));
}

/** Seconds left in a timed game (negative once over), `undefined` without a time limit. */
export function timeLeft(
  game: Pick<Game, 'mode' | 'start' | 'paused' | 'pausedFor'>,
  now: number,
): number | undefined {
  const minutes = modeOf(game).minutes;
  return minutes === undefined ? undefined : minutes * 60 - playTime(game, now) / 1000;
}

/** The team that has won: on goals, or by leading when the time is up. */
export function decidedWinner(
  game: Pick<Game, 'teams' | 'mode' | 'start' | 'paused' | 'pausedFor'>,
  now: number,
): TeamColor | undefined {
  const left = timeLeft(game, now);
  return winnerOf(game) ?? (left !== undefined && left <= 0 ? leaderOf(game) : undefined);
}

/** The defender and the attacker of a team change places, taking their goals along. */
export function swapPositions(team: Team): Team {
  return { defence: team.offence, offence: team.defence };
}

/** Wins needed to take a best-of series. */
export function winsNeeded(bestOf: number): number {
  return Math.floor(bestOf / 2) + 1;
}

/** Identifies a team across games whatever its colour: its players. */
export function sideOf(team: Team | Lineup): string {
  return lineupPlayers(team).sort().join('+');
}

export function lineupOf(team: Team): Lineup {
  return { defence: team.defence.player, offence: team.offence.player };
}

/** Distinct player ids of a lineup. */
export function lineupPlayers(team: Team | Lineup): string[] {
  const defence = typeof team.defence === 'string' ? team.defence : team.defence.player;
  const offence = typeof team.offence === 'string' ? team.offence : team.offence.player;
  return defence === offence ? [defence] : [defence, offence];
}

/**
 * Games won in a series by the teams of `game`, under the colours they have in that game,
 * and the team that has taken the series, if any.
 */
export function seriesScore(
  game: Pick<Game, 'teams' | 'series'>,
  seriesGames: Pick<Game, 'teams' | 'win'>[],
): Record<TeamColor, number> & { winner?: TeamColor } {
  const score = { red: 0, blue: 0 };
  const sides = { red: sideOf(game.teams.red), blue: sideOf(game.teams.blue) };
  for (const played of seriesGames) {
    const winner = played.win && sideOf(played.teams[played.win]);
    const color = TEAM_COLORS.find((c) => sides[c] === winner);
    if (color) {
      score[color]++;
    }
  }
  const needed = winsNeeded(game.series?.bestOf ?? 1);
  const winner = TEAM_COLORS.find((color) => score[color] >= needed);
  return { ...score, winner };
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
