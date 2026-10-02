import { Game } from '../game/game';

export interface League {
  id: string;
  name: string;
  /** ISO date. */
  created: string;
  players: string[];
  /** Locked (archived) leagues take no new players, games or tournaments. */
  archived?: boolean;
  /** Fewest games to be ranked; players below it are listed apart. */
  minGames?: number;
  /** Deleted leagues are hidden; nothing is erased and they can be restored. */
  deleted?: boolean;
  /** The league was deleted with its games: restoring it brings them back too. */
  gamesDeleted?: boolean;
}

/** Stands for every league at once: the overall ranking and player profiles. */
export const ALL_LEAGUES = '*';

/** The games from 2017 have no `league` field; they belong to the league with this id. */
export const LEGACY_LEAGUE_ID = 'legacy';

export function leagueOf(game: Pick<Game, 'league'>): string {
  return game.league ?? LEGACY_LEAGUE_ID;
}
