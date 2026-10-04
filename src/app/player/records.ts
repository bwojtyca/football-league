import {
  Game,
  lineupPlayers,
  modeOf,
  opponent,
  sideOf,
  TEAM_COLORS,
  teamOf,
  teamPlayers,
  teamScore,
} from '../game/game';
import { timelineOf } from '../game/timeline';
import { K_FACTOR, Ratings } from './rating';

/** A win after being this many goals behind counts as a great comeback. */
export const COMEBACK_GOALS = 4;
/** ...and this many as a huge one. */
export const BIG_COMEBACK_GOALS = 6;
/** Wins in a row for the streak achievements. */
export const STREAK_WINS = 5;
export const SHORT_STREAK_WINS = 3;
export const LONG_STREAK_WINS = 10;
/** Games played for the milestone achievement (the others are in `GAME_MILESTONES`). */
export const MILESTONE_GAMES = 100;
export const GAME_MILESTONES = { games10: 10, games50: 50, milestone: 100, games250: 250 };
/** A win with at most this chance (from the Elo ratings before the game) beats the odds. */
export const UNDERDOG_CHANCE = 0.3;
/** Losses in a row for the losing streak mishap. */
export const LOSS_STREAK = 5;

/** Achievements first, then the mishaps (for the potato in everyone). */
export const ACHIEVEMENTS = [
  'firstWin',
  'shutout',
  'comeback',
  'bigComeback',
  'streak3',
  'streak',
  'streak10',
  'giantKiller',
  'hatTrick',
  'solo',
  'goalieGoal',
  'goldenGoal',
  'marathon',
  'revenge',
  'games10',
  'games50',
  'milestone',
  'games250',
] as const;
export const MISHAPS = ['underTable', 'ownGoal', 'lossStreak'] as const;
export type AchievementId = (typeof ACHIEVEMENTS)[number] | (typeof MISHAPS)[number];

/**
 * An achievement: how many times it was earned and when (the last time; the first for the
 * one-offs: the first win, the game milestones).
 */
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
  achievements: Record<AchievementId, Achievement>;
}

/**
 * Records, achievements and mishaps of a player from their finished games, rating history and
 * (for wins against the odds) the rating changes of each game.
 */
export function playerRecords(
  playerId: string,
  games: Game[],
  history: number[] = [],
  changes?: Ratings['changes'],
): PlayerRecords {
  const played = games
    .filter((game) => game.win && game.players.includes(playerId))
    .sort((a, b) => (a.start < b.start ? -1 : 1));
  const achievements = Object.fromEntries(
    [...ACHIEVEMENTS, ...MISHAPS].map((id) => [id, { count: 0 }]),
  ) as Record<AchievementId, Achievement>;
  const records: PlayerRecords = {
    longestWinStreak: 0,
    longestLossStreak: 0,
    peakRating: history.length ? Math.round(Math.max(...history)) : undefined,
    achievements,
  };
  /** Earned again (the date is the last time), or once (the date is the first time). */
  const earn = (id: AchievementId, date: string, once = false) => {
    const earned = achievements[id];
    if (!once || !earned.count) {
      achievements[id] = { count: earned.count + 1, date };
    }
  };
  let wins = 0;
  let losses = 0;
  let biggest = 0;
  /** The opponents of the previous game and its result, for revenge. */
  let previous: { opponents: string; won: boolean } | undefined;
  played.forEach((game, index) => {
    const date = game.start;
    const color = teamOf(game, playerId)!;
    const team = game.teams[color];
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
    if (won) {
      earn('firstWin', date, true);
    }
    if (won && other === 0) {
      earn('shutout', date);
    }
    const deficit = timelineOf(game)?.biggestLead[opponent(color)]?.lead ?? 0;
    if (won && deficit >= COMEBACK_GOALS) {
      earn('comeback', date);
    }
    if (won && deficit >= BIG_COMEBACK_GOALS) {
      earn('bigComeback', date);
    }
    for (const [id, needed] of [
      ['streak3', SHORT_STREAK_WINS],
      ['streak', STREAK_WINS],
      ['streak10', LONG_STREAK_WINS],
    ] as const) {
      if (wins === needed) {
        earn(id, date);
      }
    }
    for (const [id, count] of Object.entries(GAME_MILESTONES)) {
      if (index + 1 === count) {
        earn(id as AchievementId, date, true);
      }
    }
    const delta = changes?.get(game.id)?.get(playerId);
    if (won && delta !== undefined && 1 - delta / K_FACTOR <= UNDERDOG_CHANCE) {
      earn('giantKiller', date);
    }
    const slots = [team.defence, team.offence].filter((slot) => slot.player === playerId);
    const scored = slots.reduce((sum, slot) => sum + slot.goals, 0);
    if (won && teamPlayers(team).length === 2 && own > 0 && scored === own) {
      earn('solo', date);
    }
    if (won && own >= modeOf(game).target + 2) {
      earn('marathon', date);
    }
    const goals = (game.events ?? []).filter((event) => event.type !== 'swap');
    let run = 0;
    let hatTrick = false;
    for (const goal of goals) {
      run = goal.type === 'goal' && goal.player === playerId ? run + 1 : 0;
      hatTrick ||= run === 3;
    }
    if (hatTrick) {
      earn('hatTrick', date);
    }
    if (goals.some((g) => g.type === 'goal' && g.player === playerId && g.rod === 'goalie')) {
      earn('goalieGoal', date);
    }
    const minutes = modeOf(game).minutes;
    const last = goals.at(-1);
    if (
      won &&
      minutes &&
      last?.type === 'goal' &&
      last.player === playerId &&
      last.at >= minutes * 60_000
    ) {
      earn('goldenGoal', date);
    }
    const opponents = sideOf(game.teams[opponent(color)]);
    if (won && previous && !previous.won && previous.opponents === opponents) {
      earn('revenge', date);
    }
    previous = { opponents, won };
    if (!won && own === 0) {
      earn('underTable', date);
    }
    if (slots.some((slot) => slot.ownGoals > 0)) {
      earn('ownGoal', date);
    }
    if (losses === LOSS_STREAK) {
      earn('lossStreak', date);
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
