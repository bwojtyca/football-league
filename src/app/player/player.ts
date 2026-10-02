import { Game, teamOf } from '../game/game';
import { PROVISIONAL_GAMES, Ratings, START_RATING } from './rating';

/**
 * Documents created before 2026 also hold `wins`/`loses` counters; they drifted from
 * the games over time and are no longer used, results are counted from the games.
 */
export interface Player {
  id: string;
  name: string;
}

export type Result = 'W' | 'L';

export interface RankedPlayer extends Player {
  /** Rounded Elo rating, `null` before the first finished game. */
  rating: number | null;
  /** Rounded rating change in the player's last game. */
  change: number | null;
  wins: number;
  loses: number;
  games: number;
  /** Percentage of games won, two decimals. */
  winRatio: number;
  /** Results of the last 5 games, oldest first. */
  form: Result[];
  provisional: boolean;
}

/** Results of each player in finished games, oldest first. */
export function results(games: Game[]): Map<string, Result[]> {
  const byPlayer = new Map<string, Result[]>();
  const finished = games
    .filter((game) => game.end && game.win)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  for (const game of finished) {
    for (const id of new Set(game.players)) {
      const result: Result = teamOf(game, id) === game.win ? 'W' : 'L';
      byPlayer.set(id, [...(byPlayer.get(id) ?? []), result]);
    }
  }
  return byPlayer;
}

/** Players by rating (best first); players without games last, by name. */
export function rankPlayers(players: Player[], games: Game[], ratings: Ratings): RankedPlayer[] {
  const byPlayer = results(games);
  return players
    .map((player): RankedPlayer => {
      const own = byPlayer.get(player.id) ?? [];
      const wins = own.filter((r) => r === 'W').length;
      const rating = ratings.current.get(player.id);
      const history = ratings.history.get(player.id) ?? [];
      const last = history.length > 1 ? history[history.length - 2] : null;
      return {
        id: player.id,
        name: player.name,
        rating: rating === undefined ? null : Math.round(rating),
        change: rating === undefined ? null : Math.round(rating) - Math.round(last ?? START_RATING),
        wins,
        loses: own.length - wins,
        games: own.length,
        winRatio: own.length ? Math.round((wins / own.length) * 10000) / 100 : 0,
        form: own.slice(-5),
        provisional: own.length < PROVISIONAL_GAMES,
      };
    })
    .sort((a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity) || compareNames(a, b));
}

export function compareNames(a: Pick<Player, 'name'>, b: Pick<Player, 'name'>): number {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}
