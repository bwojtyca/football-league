import { Game } from '../game/game';

export interface League {
  id: string;
  name: string;
  /** ISO date. */
  created: string;
  players: string[];
  /** Archived leagues are read-only: no new players or games. */
  archived?: boolean;
}

/** The games from 2017 have no `league` field; they belong to the league with this id. */
export const LEGACY_LEAGUE_ID = 'legacy';

export function leagueOf(game: Pick<Game, 'league'>): string {
  return game.league ?? LEGACY_LEAGUE_ID;
}
