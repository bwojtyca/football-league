import { Game, Position, TEAM_COLORS, TeamColor, teamPlayers } from '../game/game';

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
  /**
   * Separate ratings for playing in defence and in attack, from 2 vs 2 games only: a team is
   * rated as the average of its defender's defence rating and its attacker's attack rating.
   */
  positions: Map<string, Record<Position, PositionRating>>;
}

export interface PositionRating {
  rating: number;
  games: number;
}

/** Elo for teams: a team's rating is the average of its players', every player gets the change. */
export function computeRatings(games: Game[]): Ratings {
  const current = new Map<string, number>();
  const changes = new Map<string, Map<string, number>>();
  const history = new Map<string, number[]>();
  const positions = new Map<string, Record<Position, PositionRating>>();
  const rating = (id: string) => current.get(id) ?? START_RATING;
  const positionOf = (id: string) => {
    if (!positions.has(id)) {
      positions.set(id, {
        defence: { rating: START_RATING, games: 0 },
        offence: { rating: START_RATING, games: 0 },
      });
    }
    return positions.get(id)!;
  };

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

    if (TEAM_COLORS.every((color) => players[color].length === 2)) {
      const lineup = (color: TeamColor) => {
        const { defence, offence } = game.teams[color];
        return [positionOf(defence.player).defence, positionOf(offence.player).offence];
      };
      const strength = (color: TeamColor) =>
        lineup(color).reduce((sum, p) => sum + p.rating, 0) / 2;
      const before = { red: strength('red'), blue: strength('blue') };
      for (const color of TEAM_COLORS) {
        const other = color === 'red' ? 'blue' : 'red';
        const delta =
          K_FACTOR * ((game.win === color ? 1 : 0) - winChance(before[color], before[other]));
        for (const position of lineup(color)) {
          position.rating += delta;
          position.games++;
        }
      }
    }
  }
  return { current, changes, history, positions };
}

/** Probability that a team rated `a` beats a team rated `b`. */
export function winChance(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400));
}
