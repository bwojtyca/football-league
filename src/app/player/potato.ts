import { Game, lineupPlayers, opponent, TEAM_COLORS, teamScore } from '../game/game';
import { K_FACTOR, START_RATING, winChance } from './rating';

/**
 * The potato of the day, as the group played it in 2017: whoever ends a day as its weakest
 * becomes the potato and keeps the title until they play a day without being the weakest; a
 * potato who stays away keeps it, so there can be several. On the days after, a potato's wins
 * count for them and losing to a potato costs more: the weak get mocked, the strong cannot
 * get cocky. Checked against the 42 days of 2017 with `scripts/simulate-potato.mjs` (5 Oct
 * 2026): the potato of the day is one of the two weakest about half the days, one of the two
 * strongest a fifth. Every number is here.
 */
export const POTATO_POINTS = {
  /** Every lost game. */
  loss: 1,
  /** Every won game. */
  win: -1,
  /** Lost without scoring a goal. */
  shutoutLoss: 2,
  /** Lost as clear favourites (a win chance of at least `FAVOURITE`): the strong pay for it. */
  upsetLoss: 3,
  /** Lost to a team with a potato in it. */
  lossToPotato: 3,
  /** A potato's own win. */
  potatoWin: -2,
};

/** A win chance from this up makes a team the clear favourite. */
export const FAVOURITE = 0.65;
/** Fewest games in a day to be its potato (when nobody has as many, everyone who played). */
export const POTATO_DAY_GAMES = 3;

/** A player's points on one day. */
export interface DayRow {
  player: string;
  points: number;
  games: number;
}

export interface PotatoState {
  /** The potatoes now, each since the day that made them (`YYYY-MM-DD`). */
  holders: { player: string; since: string }[];
  /** The day in progress (today), worst first: who would be the potato if it ended now. */
  today: DayRow[];
  /** The potato of each finished day, oldest first. */
  potatoes: { day: string; player: string }[];
  /** Days each player ended as the potato. */
  days: Map<string, number>;
}

/** The local day of a game, `YYYY-MM-DD`. */
export function dayOf(time: string | Date): string {
  const date = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The potatoes of a set of games, day by day; games of `now`'s day are still in progress. */
export function potatoState(games: Game[], now = new Date()): PotatoState {
  const today = dayOf(now);
  const ratings = new Map<string, number>();
  const rating = (id: string) => ratings.get(id) ?? START_RATING;
  let holders = new Map<string, string>();
  const potatoes: PotatoState['potatoes'] = [];
  const days = new Map<string, number>();
  let rows: DayRow[] = [];

  const finished = games.filter((game) => game.win).sort((a, b) => (a.start < b.start ? -1 : 1));
  const byDay = new Map<string, Game[]>();
  for (const game of finished) {
    byDay.set(dayOf(game.start), [...(byDay.get(dayOf(game.start)) ?? []), game]);
  }
  for (const [day, played] of byDay) {
    const points = new Map<string, DayRow>();
    for (const game of played) {
      const teams = { red: lineupPlayers(game.teams.red), blue: lineupPlayers(game.teams.blue) };
      const strength = (color: 'red' | 'blue') =>
        teams[color].reduce((sum, id) => sum + rating(id), 0) / teams[color].length;
      const before = { red: strength('red'), blue: strength('blue') };
      for (const color of TEAM_COLORS) {
        const other = opponent(color);
        const won = game.win === color;
        const chance = winChance(before[color], before[other]);
        let change = won ? POTATO_POINTS.win : POTATO_POINTS.loss;
        if (!won && teamScore(game, color) === 0) {
          change += POTATO_POINTS.shutoutLoss;
        }
        if (!won && chance >= FAVOURITE) {
          change += POTATO_POINTS.upsetLoss;
        }
        if (!won && teams[other].some((id) => holders.has(id))) {
          change += POTATO_POINTS.lossToPotato;
        }
        const delta = K_FACTOR * ((won ? 1 : 0) - chance);
        for (const id of teams[color]) {
          const row = points.get(id) ?? { player: id, points: 0, games: 0 };
          row.points += change + (won && holders.has(id) ? POTATO_POINTS.potatoWin : 0);
          row.games++;
          points.set(id, row);
          ratings.set(id, rating(id) + delta);
        }
      }
    }
    // Worst first; on a tie more games, then the weaker by Elo.
    rows = [...points.values()].sort(
      (a, b) => b.points - a.points || b.games - a.games || rating(a.player) - rating(b.player),
    );
    if (day >= today) {
      break;
    }
    const enough = rows.filter((row) => row.games >= POTATO_DAY_GAMES);
    const potato = (enough.length ? enough : rows)[0].player;
    holders = new Map([...holders].filter(([id]) => !points.has(id)));
    holders.set(potato, day);
    potatoes.push({ day, player: potato });
    days.set(potato, (days.get(potato) ?? 0) + 1);
    rows = [];
  }
  return {
    holders: [...holders].map(([player, since]) => ({ player, since })),
    today: rows,
    potatoes,
    days,
  };
}

/** A row of the potato ranking: days as the potato, the potatoes now marked. */
export interface PotatoRow {
  player: string;
  /** Days ended as the potato. */
  days: number;
  games: number;
  isPotato: boolean;
  /** For a potato now: the day that made them. */
  since?: string;
  /** Points today, when they play today. */
  today?: number;
}

/** Everyone who played: most days as the potato first, the potatoes now marked. */
export function potatoRanking(games: Game[], now = new Date()): PotatoRow[] {
  const state = potatoState(games, now);
  const played = new Map<string, number>();
  for (const game of games.filter((g) => g.win)) {
    for (const id of new Set(game.players)) {
      played.set(id, (played.get(id) ?? 0) + 1);
    }
  }
  const since = new Map(state.holders.map((holder) => [holder.player, holder.since]));
  const today = new Map(state.today.map((row) => [row.player, row.points]));
  return [...played]
    .map(([player, count]) => ({
      player,
      days: state.days.get(player) ?? 0,
      games: count,
      isPotato: since.has(player),
      since: since.get(player),
      today: today.get(player),
    }))
    .sort((a, b) => b.days - a.days || b.games - a.games);
}
