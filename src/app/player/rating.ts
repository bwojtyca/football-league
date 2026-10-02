import { Game, TEAM_COLORS, TeamColor, teamPlayers } from '../game/game';

export const START_RATING = 1500;
export const K_FACTOR = 24;
/** Below this many games a rating is shown as provisional. */
export const PROVISIONAL_GAMES = 10;

export interface Ratings {
  /** Current rating of every player who finished a game. */
  current: Map<string, number>;
  /** Rating change of each player in each finished game. */
  changes: Map<string, Map<string, number>>;
  /** Rating after each of a player's games, oldest first. */
  history: Map<string, number[]>;
}

/** Elo for teams: a team's rating is the average of its players', every player gets the change. */
export function computeRatings(games: Game[]): Ratings {
  const current = new Map<string, number>();
  const changes = new Map<string, Map<string, number>>();
  const history = new Map<string, number[]>();
  const rating = (id: string) => current.get(id) ?? START_RATING;

  const finished = games
    .filter((game) => game.end && game.win)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  for (const game of finished) {
    const players = {
      red: teamPlayers(game.teams.red),
      blue: teamPlayers(game.teams.blue),
    } as Record<TeamColor, string[]>;
    const team = (color: TeamColor) =>
      players[color].reduce((sum, id) => sum + rating(id), 0) / players[color].length;
    const before = { red: team('red'), blue: team('blue') };
    const gameChanges = new Map<string, number>();
    for (const color of TEAM_COLORS) {
      const other = color === 'red' ? 'blue' : 'red';
      const expected = winChance(before[color], before[other]);
      const delta = K_FACTOR * ((game.win === color ? 1 : 0) - expected);
      for (const id of players[color]) {
        gameChanges.set(id, delta);
      }
    }
    for (const [id, delta] of gameChanges) {
      const next = rating(id) + delta;
      current.set(id, next);
      history.set(id, [...(history.get(id) ?? []), next]);
    }
    changes.set(game.id, gameChanges);
  }
  return { current, changes, history };
}

/** Probability that a team rated `a` beats a team rated `b`. */
export function winChance(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400));
}
