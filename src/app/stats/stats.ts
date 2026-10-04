import {
  FIGURES,
  Game,
  GameEvent,
  GameMode,
  modeOf,
  opponent,
  playTime,
  Rod,
  TEAM_COLORS,
  TeamColor,
  teamOf,
  teamPlayers,
  teamScore,
} from '../game/game';
import { timelineOf } from '../game/timeline';
import { results } from '../player/player';
import { Ratings, START_RATING } from '../player/rating';

/** Finished games, oldest first (the order of the Elo ratings). */
export function finished(games: Game[]): Game[] {
  return games
    .filter((game) => game.end && game.win)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/** Seconds a finished game was played, pauses left out. */
export function gameSeconds(game: Pick<Game, 'start' | 'end' | 'paused' | 'pausedFor'>): number {
  return game.end ? playTime(game, Date.parse(game.end)) / 1000 : 0;
}

/** A game that holds a record, with the value of the record. */
export interface GameRecord {
  game: Game;
  value: number;
}

/** The game with the highest `value` (the lowest with `lowest`); the oldest wins a tie. */
function best(
  games: Game[],
  value: (game: Game) => number | undefined,
  lowest = false,
): GameRecord | undefined {
  let record: GameRecord | undefined;
  for (const game of games) {
    const v = value(game);
    if (v !== undefined && (!record || (lowest ? v < record.value : v > record.value))) {
      record = { game, value: v };
    }
  }
  return record;
}

/** Goals of the winner minus goals of the loser. */
export function margin(game: Game): number {
  return game.win ? teamScore(game, game.win) - teamScore(game, opponent(game.win)) : 0;
}

/** Goals of both teams. */
export function totalGoals(game: Game): number {
  return teamScore(game, 'red') + teamScore(game, 'blue');
}

/** Milliseconds from the start to the first goal of a game with a log. */
export function firstGoalAt(game: Game): number | undefined {
  return game.events?.find((event) => event.type !== 'swap')?.at;
}

/** Most goals the winner was behind (games with a log), when it came back from two or more. */
export function comebackOf(game: Game): number | undefined {
  return timelineOf(game)?.comeback ? deficitOf(game) : undefined;
}

function deficitOf(game: Game): number {
  const loser = game.win && opponent(game.win);
  return (loser && timelineOf(game)?.biggestLead[loser]?.lead) || 0;
}

export interface LeagueStats {
  games: number;
  goals: number;
  ownGoals: number;
  /** Seconds played in all. */
  seconds: number;
  /** Games won without conceding. */
  shutouts: number;
  players: number;
  /** Games per month (`YYYY-MM`, local time), only months with games, oldest first. */
  months: { month: string; games: number }[];
  /** Games by weekday (0 = Monday) and hour of the start, local time. */
  week: number[][];
  /** Wins of each colour. */
  colors: Record<TeamColor, number>;
  /** Goals scored from defence and from attack, in 2 vs 2 games. */
  positions: { games: number; defence: number; offence: number };
  records: {
    longest?: GameRecord;
    shortest?: GameRecord;
    biggestWin?: GameRecord;
    mostGoals?: GameRecord;
    /** Most goals the winner came back from (games with a log). */
    comeback?: GameRecord;
    /** Fastest first goal, in milliseconds (games with a log). */
    fastestGoal?: GameRecord;
    /** Most wins in a row by one player. */
    streak?: { player: string; wins: number };
  };
  /** Games with a log of goals (from October 2026). */
  log: GoalTiming;
}

/** When goals fall, from the games with a log. */
export interface GoalTiming {
  games: number;
  goals: number;
  /** Average milliseconds from the start to the first goal. */
  firstGoal?: number;
  /** Average milliseconds between two goals. */
  gap?: number;
  /** Goals in the first, middle and last third of their game. */
  thirds: [number, number, number];
}

/** Everything the statistics page of a league shows. */
export function leagueStats(games: Game[]): LeagueStats {
  const played = finished(games);
  const stats: LeagueStats = {
    games: played.length,
    goals: 0,
    ownGoals: 0,
    seconds: 0,
    shutouts: 0,
    players: new Set(played.flatMap((game) => game.players)).size,
    months: [],
    week: Array.from({ length: 7 }, () => Array<number>(24).fill(0)),
    colors: { red: 0, blue: 0 },
    positions: { games: 0, defence: 0, offence: 0 },
    records: {},
    log: goalTiming(played),
  };
  const months = new Map<string, number>();
  for (const game of played) {
    stats.goals += totalGoals(game);
    stats.seconds += gameSeconds(game);
    stats.colors[game.win!]++;
    if (teamScore(game, opponent(game.win!)) === 0) {
      stats.shutouts++;
    }
    for (const color of TEAM_COLORS) {
      stats.ownGoals += game.teams[color].defence.ownGoals + game.teams[color].offence.ownGoals;
    }
    if (TEAM_COLORS.every((color) => teamPlayers(game.teams[color]).length === 2)) {
      stats.positions.games++;
      for (const color of TEAM_COLORS) {
        stats.positions.defence += game.teams[color].defence.goals;
        stats.positions.offence += game.teams[color].offence.goals;
      }
    }
    const start = new Date(game.start);
    const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    months.set(month, (months.get(month) ?? 0) + 1);
    stats.week[(start.getDay() + 6) % 7][start.getHours()]++;
  }
  stats.months = [...months].sort().map(([month, count]) => ({ month, games: count }));

  let streak: LeagueStats['records']['streak'];
  for (const [player, list] of results(played)) {
    let run = 0;
    for (const result of list) {
      run = result === 'W' ? run + 1 : 0;
      if (run > (streak?.wins ?? 0)) {
        streak = { player, wins: run };
      }
    }
  }
  stats.records = {
    longest: best(played, gameSeconds),
    shortest: best(played, gameSeconds, true),
    biggestWin: best(played, margin),
    mostGoals: best(played, totalGoals),
    comeback: best(played, comebackOf),
    fastestGoal: best(played, firstGoalAt, true),
    streak,
  };
  return stats;
}

/** Goal times of the games with a log. */
export function goalTiming(games: Game[], scorer?: string): GoalTiming {
  const timing: GoalTiming = { games: 0, goals: 0, thirds: [0, 0, 0] };
  let firstGoals = 0;
  let firstGoalSum = 0;
  let gaps = 0;
  let gapSum = 0;
  for (const game of games) {
    const goals = (game.events ?? []).filter((event) => event.type !== 'swap');
    if (!game.events || !game.end) {
      continue;
    }
    timing.games++;
    if (goals.length) {
      firstGoals++;
      firstGoalSum += goals[0].at;
    }
    goals.slice(1).forEach((goal, i) => {
      gaps++;
      gapSum += goal.at - goals[i].at;
    });
    const length = gameSeconds(game) * 1000 || goals.at(-1)?.at || 1;
    for (const goal of goals) {
      if (scorer && (goal.type !== 'goal' || goal.player !== scorer)) {
        continue;
      }
      timing.goals++;
      timing.thirds[Math.min(2, Math.floor((goal.at / length) * 3))]++;
    }
  }
  timing.firstGoal = firstGoals && !scorer ? firstGoalSum / firstGoals : undefined;
  timing.gap = gaps && !scorer ? gapSum / gaps : undefined;
  return timing;
}

/**
 * Every player's rating after each finished game of the league, from the Elo changes:
 * `null` before their first game.
 */
export function ratingTimeline(games: Game[], ratings: Ratings): Map<string, (number | null)[]> {
  const played = finished(games);
  const lines = new Map<string, (number | null)[]>();
  const current = new Map<string, number>();
  played.forEach((game, index) => {
    for (const [player, delta] of ratings.changes.get(game.id) ?? []) {
      current.set(player, (current.get(player) ?? START_RATING) + delta);
      if (!lines.has(player)) {
        lines.set(player, Array<number | null>(played.length).fill(null));
      }
    }
    for (const [player, line] of lines) {
      line[index] = Math.round(current.get(player)!);
    }
  });
  return lines;
}

export interface HeadToHead {
  /** Games on opposite sides: wins and goals of the first player's team, then the other's. */
  against: { games: number; wins: [number, number]; goals: [number, number]; list: Game[] };
  /** Games in the same team. */
  together: { games: number; wins: number; goals: number; conceded: number; list: Game[] };
}

/** Two players against each other and together, from the finished games. */
export function headToHead(games: Game[], a: string, b: string): HeadToHead {
  const h2h: HeadToHead = {
    against: { games: 0, wins: [0, 0], goals: [0, 0], list: [] },
    together: { games: 0, wins: 0, goals: 0, conceded: 0, list: [] },
  };
  for (const game of finished(games)) {
    const colorA = teamOf(game, a);
    const colorB = teamOf(game, b);
    if (!colorA || !colorB) {
      continue;
    }
    if (colorA === colorB) {
      const { together } = h2h;
      together.games++;
      together.wins += Number(game.win === colorA);
      together.goals += teamScore(game, colorA);
      together.conceded += teamScore(game, opponent(colorA));
      together.list.push(game);
    } else {
      const { against } = h2h;
      against.games++;
      against.wins[game.win === colorA ? 0 : 1]++;
      against.goals[0] += teamScore(game, colorA);
      against.goals[1] += teamScore(game, colorB);
      against.list.push(game);
    }
  }
  return h2h;
}

/** A player's record under each set of rules, the rules played most first. */
export function modeRecords(
  games: Game[],
  player: string,
): { mode: GameMode; games: number; wins: number }[] {
  const byMode = new Map<string, { mode: GameMode; games: number; wins: number }>();
  for (const game of finished(games)) {
    const color = teamOf(game, player);
    if (!color) {
      continue;
    }
    const { target, winBy, max, minutes } = modeOf(game);
    const mode = { target, winBy, max, minutes };
    const key = JSON.stringify(mode);
    const entry = byMode.get(key) ?? { mode: modeOf(game), games: 0, wins: 0 };
    entry.games++;
    entry.wins += Number(game.win === color);
    byMode.set(key, entry);
  }
  return [...byMode.values()].sort((x, y) => y.games - x.games);
}

/** How a player's goals mattered, from the games with a log (own goals left out). */
export interface GoalMoments {
  games: number;
  goals: number;
  /** The first goal of the game. */
  first: number;
  /** Goals that levelled the score. */
  equalizers: number;
  /** Goals that put the team ahead from a level score. */
  goAhead: number;
  /** The last goal of a game the team won. */
  winners: number;
  /** Average minute of the player's goals (play time). */
  minute?: number;
  thirds: [number, number, number];
}

export function goalMoments(games: Game[], player: string): GoalMoments {
  const logged = finished(games).filter((game) => game.events && teamOf(game, player));
  const timing = goalTiming(logged, player);
  const moments: GoalMoments = {
    games: timing.games,
    goals: 0,
    first: 0,
    equalizers: 0,
    goAhead: 0,
    winners: 0,
    thirds: timing.thirds,
  };
  let minutes = 0;
  for (const game of logged) {
    const score = { red: 0, blue: 0 };
    const goals = game.events!.filter(
      (event): event is Exclude<GameEvent, { type: 'swap' }> => event.type !== 'swap',
    );
    goals.forEach((goal, index) => {
      const team = goal.type === 'own' ? opponent(goal.team) : goal.team;
      const level = score[team] === score[opponent(team)];
      score[team]++;
      if (goal.type !== 'goal' || goal.player !== player) {
        return;
      }
      moments.goals++;
      minutes += goal.at / 60_000;
      moments.first += Number(index === 0);
      moments.equalizers += Number(score[team] === score[opponent(team)]);
      moments.goAhead += Number(level);
      moments.winners += Number(index === goals.length - 1 && game.win === team);
    });
  }
  moments.minute = moments.goals ? minutes / moments.goals : undefined;
  return moments;
}

/** Time a player spent playing: in all, per game, and in the current month. */
export function playerTime(
  games: Game[],
  player: string,
  now = new Date(),
): { seconds: number; games: number; month: { seconds: number; games: number } } {
  const time = { seconds: 0, games: 0, month: { seconds: 0, games: 0 } };
  for (const game of finished(games)) {
    if (!teamOf(game, player)) {
      continue;
    }
    const seconds = gameSeconds(game);
    time.seconds += seconds;
    time.games++;
    const start = new Date(game.start);
    if (start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth()) {
      time.month.seconds += seconds;
      time.month.games++;
    }
  }
  return time;
}

/** A game ranked among the finished games of its league, in what makes it stand out. */
export interface GameFact {
  key: string;
  params: Record<string, string | number>;
}

/** Top places that are worth a mention. */
const FACT_PLACES = 3;

/** Where a finished game stands among the league's games: records and rankings. */
export function gameFacts(game: Game, leagueGames: Game[]): GameFact[] {
  const played = finished(leagueGames);
  if (!game.win || played.length < 2) {
    return [];
  }
  /** 1 + the games strictly better, or nothing when outside the top places. */
  const place = (value: (g: Game) => number | undefined, lowest = false) => {
    const own = value(game);
    if (own === undefined) {
      return undefined;
    }
    const better = played.filter((other) => {
      const v = value(other);
      return v !== undefined && (lowest ? v < own : v > own);
    }).length;
    return better < FACT_PLACES ? better + 1 : undefined;
  };
  const facts: GameFact[] = [];
  const add = (
    key: string,
    n: number | undefined,
    params: Record<string, string | number> = {},
  ) => {
    if (n !== undefined) {
      facts.push({ key, params: { n, ...params } });
    }
  };
  add('facts.longest', place(gameSeconds));
  add('facts.shortest', place(gameSeconds, true));
  add('facts.biggestWin', margin(game) > 1 ? place(margin) : undefined);
  add('facts.mostGoals', place(totalGoals));
  add('facts.comeback', comebackOf(game) ? place(comebackOf) : undefined);
  add('facts.fastestGoal', place(firstGoalAt, true));
  const average = played.reduce((sum, g) => sum + gameSeconds(g), 0) / played.length;
  facts.push({
    key: 'facts.duration',
    params: { time: Math.round(gameSeconds(game)), average: Math.round(average) },
  });
  return facts;
}

/** The best players and the records of a set of games, e.g. a tournament. */
export interface TournamentSummary {
  games: number;
  seconds: number;
  goals: number;
  /** Most goals (own goals left out); several players on a tie. */
  scorers?: { players: string[]; goals: number };
  mostWins?: { players: string[]; wins: number };
  /** Fewest goals conceded per game in defence (2 vs 2 games, at least two of them). */
  defence?: { players: string[]; conceded: number };
  longest?: GameRecord;
  biggestWin?: GameRecord;
}

export function tournamentSummary(games: Game[]): TournamentSummary {
  const played = finished(games);
  const goals = new Map<string, number>();
  const wins = new Map<string, number>();
  const defence = new Map<string, { games: number; conceded: number }>();
  const add = (map: Map<string, number>, player: string, n: number) =>
    map.set(player, (map.get(player) ?? 0) + n);
  for (const game of played) {
    for (const color of TEAM_COLORS) {
      const team = game.teams[color];
      add(goals, team.defence.player, team.defence.goals);
      add(goals, team.offence.player, team.offence.goals);
      if (team.offence.player !== team.defence.player) {
        const own = defence.get(team.defence.player) ?? { games: 0, conceded: 0 };
        own.games++;
        own.conceded += teamScore(game, opponent(color));
        defence.set(team.defence.player, own);
      }
      for (const player of teamPlayers(team)) {
        add(wins, player, Number(game.win === color));
      }
    }
  }
  /** The players with the highest value (lowest with `lowest`), when it is above zero. */
  const top = (values: Map<string, number>, lowest = false) => {
    const list = [...values].filter(([, value]) => lowest || value > 0);
    if (!list.length) {
      return undefined;
    }
    const value = (lowest ? Math.min : Math.max)(...list.map(([, v]) => v));
    return { players: list.filter(([, v]) => v === value).map(([p]) => p), value };
  };
  const scorers = top(goals);
  const mostWins = top(wins);
  const tight = top(
    new Map(
      [...defence]
        .filter(([, d]) => d.games >= 2)
        .map(([player, d]) => [player, d.conceded / d.games]),
    ),
    true,
  );
  return {
    games: played.length,
    seconds: played.reduce((sum, game) => sum + gameSeconds(game), 0),
    goals: played.reduce((sum, game) => sum + totalGoals(game), 0),
    scorers: scorers && { players: scorers.players, goals: scorers.value },
    mostWins: mostWins && { players: mostWins.players, wins: mostWins.value },
    defence: tight && { players: tight.players, conceded: tight.value },
    longest: best(played, gameSeconds),
    biggestWin: best(played, margin),
  };
}

/** Goals told down to the rod (and figure), of a player or of everyone, from the logs. */
export interface LineStats {
  /** Logged goals and own goals: told by rod, and told by position only. */
  known: number;
  unknown: number;
  /** By rod: goals, own goals, and goals by figure (index 0 is figure 1) when told. */
  rods: Record<Rod, { goals: number; own: number; men: number[] }>;
}

export function lineStats(games: Game[], player?: string): LineStats {
  const stats: LineStats = {
    known: 0,
    unknown: 0,
    rods: {
      goalie: { goals: 0, own: 0, men: [0] },
      defence: { goals: 0, own: 0, men: [0, 0] },
      midfield: { goals: 0, own: 0, men: [0, 0, 0, 0, 0] },
      attack: { goals: 0, own: 0, men: [0, 0, 0] },
    },
  };
  for (const game of finished(games)) {
    for (const event of game.events ?? []) {
      if (event.type === 'swap' || (player && event.player !== player)) {
        continue;
      }
      if (!event.rod) {
        stats.unknown++;
        continue;
      }
      stats.known++;
      const rod = stats.rods[event.rod];
      if (event.type === 'own') {
        rod.own++;
      } else {
        rod.goals++;
        if (event.man && event.man <= FIGURES[event.rod]) {
          rod.men[event.man - 1]++;
        }
      }
    }
  }
  return stats;
}
