import { Game, lineupPlayers, opponent, TEAM_COLORS, teamOf, teamScore } from '../game/game';
import { timelineOf } from '../game/timeline';

/** A win after being this many goals behind counts as a great comeback. */
export const COMEBACK_GOALS = 4;
/** Wins in a row for the streak achievement. */
export const STREAK_WINS = 5;
/** Games played for the milestone achievement. */
export const MILESTONE_GAMES = 100;

/** An achievement: how many times it was earned and when last (or first, for one-offs). */
export interface Achievement {
  count: number;
  date?: string;
}

export interface PlayerRecords {
  longestWinStreak: number;
  longestLossStreak: number;
  peakRating?: number;
  /** The win with the biggest goal difference, as "8:2". */
  biggestWin?: string;
  achievements: {
    /** Won without conceding a goal. */
    shutout: Achievement;
    /** Won after being `COMEBACK_GOALS` behind (games with a log only). */
    comeback: Achievement;
    /** `STREAK_WINS` wins in a row, first reached on `date`. */
    streak: Achievement;
    /** `MILESTONE_GAMES` games played, reached on `date`. */
    milestone: Achievement;
  };
}

/** Records and achievements of a player from their finished games and rating history. */
export function playerRecords(
  playerId: string,
  games: Game[],
  history: number[] = [],
): PlayerRecords {
  const played = games
    .filter((game) => game.win && game.players.includes(playerId))
    .sort((a, b) => (a.start < b.start ? -1 : 1));
  const records: PlayerRecords = {
    longestWinStreak: 0,
    longestLossStreak: 0,
    peakRating: history.length ? Math.round(Math.max(...history)) : undefined,
    achievements: {
      shutout: { count: 0 },
      comeback: { count: 0 },
      streak: { count: 0 },
      milestone: { count: 0 },
    },
  };
  const { achievements } = records;
  let wins = 0;
  let losses = 0;
  let biggest = 0;
  played.forEach((game, index) => {
    const color = teamOf(game, playerId)!;
    const won = game.win === color;
    const own = teamScore(game, color);
    const other = teamScore(game, opponent(color));
    wins = won ? wins + 1 : 0;
    losses = won ? 0 : losses + 1;
    records.longestWinStreak = Math.max(records.longestWinStreak, wins);
    records.longestLossStreak = Math.max(records.longestLossStreak, losses);
    if (won && own - other > biggest) {
      biggest = own - other;
      records.biggestWin = `${own}:${other}`;
    }
    if (won && other === 0) {
      achievements.shutout = { count: achievements.shutout.count + 1, date: game.start };
    }
    const deficit = timelineOf(game)?.biggestLead[opponent(color)]?.lead ?? 0;
    if (won && deficit >= COMEBACK_GOALS) {
      achievements.comeback = { count: achievements.comeback.count + 1, date: game.start };
    }
    if (wins === STREAK_WINS) {
      achievements.streak = {
        count: achievements.streak.count + 1,
        date: achievements.streak.date ?? game.start,
      };
    }
    if (index + 1 === MILESTONE_GAMES) {
      achievements.milestone = { count: 1, date: game.start };
    }
  });
  return records;
}

export interface Duet {
  players: [string, string];
  games: number;
  wins: number;
  winRatio: number;
}

/** Pairs who played together in a team: those with at least `minGames` first, best first. */
export function duets(games: Game[], minGames = 3): Duet[] {
  const byPair = new Map<string, Duet>();
  for (const game of games.filter((g) => g.win)) {
    for (const color of TEAM_COLORS) {
      const players = lineupPlayers(game.teams[color]);
      if (players.length !== 2) {
        continue;
      }
      const pair = [...players].sort() as [string, string];
      const key = pair.join('+');
      const duet = byPair.get(key) ?? { players: pair, games: 0, wins: 0, winRatio: 0 };
      duet.games++;
      duet.wins += Number(game.win === color);
      duet.winRatio = (100 * duet.wins) / duet.games;
      byPair.set(key, duet);
    }
  }
  return [...byPair.values()].sort(
    (a, b) =>
      Number(b.games >= minGames) - Number(a.games >= minGames) ||
      b.winRatio - a.winRatio ||
      b.games - a.games,
  );
}
