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
  /** The Google account that owns the league: its settings are theirs (Oct 2026). */
  owner?: string;
  /** Co-owners (uids, members): the same rights as the owner, for when they are away. */
  admins?: string[];
  /** Accounts (uids) the league is private to; none on leagues from before (open). */
  members?: string[];
}

/** Stands for every league at once: the overall ranking and player profiles. */
export const ALL_LEAGUES = '*';

/** The league of a game (every game has one since the 2017 games were moved, 19 Oct 2026). */
export function leagueOf(game: Pick<Game, 'league'>): string {
  return game.league ?? '';
}

/**
 * The 2017 league moved from the id `legacy` to a generated one (19 Oct 2026): old links and
 * devices that remember `legacy` open the league where its games are now.
 */
export function currentLeagueId(id: string): string {
  return id === 'legacy' ? 'TPaiV5gUYtE68s5MFQsD' : id;
}

/** Whether `uid` runs the league: its owner or a co-owner, or anyone while it has no owner. */
export function manages(league: Pick<League, 'owner' | 'admins'>, uid: string | null): boolean {
  return !league.owner || (!!uid && (league.owner === uid || !!league.admins?.includes(uid)));
}

/** Two initials of a league's name, as its crest until leagues get one (three overflowed). */
export function crestOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
