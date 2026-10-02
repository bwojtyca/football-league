import {
  Game,
  GameMode,
  Lineup,
  lineupOf,
  lineupPlayers,
  opponent,
  sideOf,
  TEAM_COLORS,
  TeamColor,
  teamScore,
} from '../game/game';

/**
 * - `king`: king of the table. Winners stay at the table, the losers go to the back of the
 *   queue and the next in line challenge them.
 * - `dyp`: draw your partner. Each round draws who plays and with whom; the ranking is
 *   individual.
 * - `roundRobin`: fixed teams, everyone plays everyone once.
 */
export type TournamentFormat = 'king' | 'dyp' | 'roundRobin';

export const FORMATS: readonly TournamentFormat[] = ['king', 'dyp', 'roundRobin'];

/** A player joining (or with `out`, leaving) the tournament; `at` is an ISO time. */
export interface Entry {
  player: string;
  at: string;
  out?: boolean;
}

export interface Tournament {
  id: string;
  league: string;
  name: string;
  format: TournamentFormat;
  created: string;
  /** How every game of the tournament is played. */
  mode: GameMode;
  /** Players per team: 1 or 2. */
  teamSize: number;
  /** Who takes part, in the order they joined; people can join and leave on the way. */
  entries: Entry[];
  /** Round robin: the teams, fixed when the tournament starts. */
  teams?: Lineup[];
  end?: string;
}

/** Players taking part now, with the time they (last) joined, in joining order. */
export function presentPlayers(entries: Entry[]): Map<string, string> {
  const present = new Map<string, string>();
  for (const entry of entries) {
    present.delete(entry.player);
    if (!entry.out) {
      present.set(entry.player, entry.at);
    }
  }
  return present;
}

/** A lineup of one player, or of two in the given order (defence first). */
export function lineupFrom(players: string[]): Lineup {
  return { defence: players[0], offence: players[1] ?? players[0] };
}

function byEnd(a: Game, b: Game): number {
  return (a.end ?? a.start) < (b.end ?? b.start) ? -1 : 1;
}

export interface KingState {
  /** The game being played now, if any. */
  running?: Game;
  /** Holders of the table: their lineup, colour and wins in a row. */
  champions?: { lineup: Lineup; color: TeamColor; streak: number };
  /** Players waiting for their turn, first in line first. */
  queue: string[];
  /** The next game, when nothing is being played and enough players are waiting. */
  next?: Record<TeamColor, Lineup>;
  /** Longest run of wins so far. */
  record?: { lineup: Lineup; streak: number };
}

/**
 * Where a king of the table stands, worked out from its games: winners keep the table,
 * losers queue up again in the order they lost, newcomers in the order they joined.
 */
export function kingState(tournament: Tournament, games: Game[]): KingState {
  const present = presentPlayers(tournament.entries);
  const finished = games.filter((game) => game.win).sort(byEnd);
  const running = games.find((game) => !game.end);

  let champions: KingState['champions'];
  let record: KingState['record'];
  for (const game of finished) {
    const color = game.win!;
    const lineup = lineupOf(game.teams[color]);
    const streak =
      champions && sideOf(champions.lineup) === sideOf(lineup) ? champions.streak + 1 : 1;
    champions = { lineup, color, streak };
    if (!record || streak > record.streak) {
      record = { lineup, streak };
    }
  }
  // Champions who left give up the table.
  if (champions && !lineupPlayers(champions.lineup).every((player) => present.has(player))) {
    champions = undefined;
  }

  const busy = new Set([
    ...(champions ? lineupPlayers(champions.lineup) : []),
    ...(running?.players ?? []),
  ]);
  const order = [...present.keys()];
  const lastGames = new Map<string, Game>();
  for (const game of finished) {
    game.players.forEach((player) => lastGames.set(player, game));
  }
  const waitingSince = (player: string) => {
    const end = lastGames.get(player)?.end;
    const joined = present.get(player)!;
    return end && end > joined ? end : joined;
  };
  // Of two players who lost the same game, the defender queues first.
  const slot = (player: string) => {
    const last = lastGames.get(player);
    return last && TEAM_COLORS.some((c) => last.teams[c].offence.player === player) ? 1 : 0;
  };
  const queue = order
    .filter((player) => !busy.has(player))
    .sort(
      (a, b) =>
        waitingSince(a).localeCompare(waitingSince(b)) ||
        slot(a) - slot(b) ||
        order.indexOf(a) - order.indexOf(b),
    );

  let next: KingState['next'];
  const size = tournament.teamSize;
  if (!running && !tournament.end) {
    if (champions && queue.length >= size) {
      const challengers = lineupFrom(queue.slice(0, size));
      next = {
        [champions.color]: champions.lineup,
        [opponent(champions.color)]: challengers,
      } as Record<TeamColor, Lineup>;
    } else if (!champions && queue.length >= 2 * size) {
      next = {
        red: lineupFrom(queue.slice(0, size)),
        blue: lineupFrom(queue.slice(size, 2 * size)),
      };
    }
  }
  return { running, champions, queue, next, record };
}

export interface PlayerStanding {
  player: string;
  games: number;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Individual table: most wins first, then goal difference, then fewer games. */
export function playerStandings(players: string[], games: Game[]): PlayerStanding[] {
  const table = new Map(
    players.map((player) => [player, { player, games: 0, wins: 0, goalsFor: 0, goalsAgainst: 0 }]),
  );
  for (const game of games.filter((g) => g.win)) {
    for (const color of TEAM_COLORS) {
      for (const player of lineupPlayers(game.teams[color])) {
        const row = table.get(player);
        if (row) {
          row.games++;
          row.wins += Number(game.win === color);
          row.goalsFor += teamScore(game, color);
          row.goalsAgainst += teamScore(game, opponent(color));
        }
      }
    }
  }
  return [...table.values()].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      a.games - b.games,
  );
}

/** Team ratings this close (average Elo) count as an even game when drawing partners. */
const EVEN_ENOUGH = 100;

/**
 * Draws the next "draw your partner" game among the players free to play: those who played
 * least go first, partners who were together least often are paired, and the teams are
 * kept even (within `EVEN_ENOUGH` of the most even split). `random` decides the rest.
 */
export function drawRound(
  available: string[],
  games: Game[],
  ratings: Map<string, number>,
  random: () => number = Math.random,
): Record<TeamColor, Lineup> | undefined {
  if (available.length < 4) {
    return undefined;
  }
  const played = new Map<string, number>();
  const together = new Map<string, number>();
  for (const game of games) {
    for (const color of TEAM_COLORS) {
      const team = lineupPlayers(game.teams[color]);
      team.forEach((player) => played.set(player, (played.get(player) ?? 0) + 1));
      if (team.length === 2) {
        const pair = sideOf(game.teams[color]);
        together.set(pair, (together.get(pair) ?? 0) + 1);
      }
    }
  }
  const shuffle = <T>(items: T[]) =>
    items
      .map((item) => ({ item, key: random() }))
      .sort((a, b) => a.key - b.key)
      .map(({ item }) => item);

  const four = shuffle(available)
    .sort((a, b) => (played.get(a) ?? 0) - (played.get(b) ?? 0))
    .slice(0, 4);
  const [a, b, c, d] = four;
  const rating = (player: string) => ratings.get(player) ?? 1500;
  const options = shuffle([
    [
      [a, b],
      [c, d],
    ],
    [
      [a, c],
      [b, d],
    ],
    [
      [a, d],
      [b, c],
    ],
  ]).map(([x, y]) => ({
    teams: [x, y],
    together:
      (together.get(sideOf(lineupFrom(x))) ?? 0) + (together.get(sideOf(lineupFrom(y))) ?? 0),
    gap: Math.abs(rating(x[0]) + rating(x[1]) - rating(y[0]) - rating(y[1])) / 2,
  }));
  // New partners first; among those, any split close enough to the most even one.
  const fewest = Math.min(...options.map((option) => option.together));
  const fresh = options.filter((option) => option.together === fewest);
  const evenest = Math.min(...fresh.map((option) => option.gap));
  const [red, blue] = fresh.find((option) => option.gap <= evenest + EVEN_ENOUGH)!.teams;
  return { red: lineupFrom(shuffle(red)), blue: lineupFrom(shuffle(blue)) };
}

/**
 * Round robin order of play for `count` teams (circle method): pairs of team indexes,
 * round by round, so that nobody plays twice in a row when it can be avoided.
 */
export function fixtures(count: number): [number, number][] {
  const teams = [...Array(count).keys()] as (number | null)[];
  if (teams.length % 2) {
    teams.push(null);
  }
  const result: [number, number][] = [];
  for (let round = 0; round < teams.length - 1; round++) {
    for (let i = 0; i < teams.length / 2; i++) {
      const home = teams[i];
      const away = teams[teams.length - 1 - i];
      if (home !== null && away !== null) {
        result.push(round % 2 ? [away, home] : [home, away]);
      }
    }
    // Keep the first team in place and rotate the others.
    teams.splice(1, 0, teams.pop()!);
  }
  return result;
}

export interface Fixture {
  red: number;
  blue: number;
  /** The game of this pairing: finished, or being played. */
  game?: Game;
}

/** The pairings of a round robin with their games, in order of play. */
export function roundRobinFixtures(tournament: Tournament, games: Game[]): Fixture[] {
  const teams = tournament.teams ?? [];
  const sides = teams.map(sideOf);
  const key = (x: string, y: string) => [x, y].sort().join(' vs ');
  const byPairing = new Map<string, Game>();
  for (const game of games) {
    const pairing = key(sideOf(game.teams.red), sideOf(game.teams.blue));
    // A finished game wins over one still running (or abandoned).
    if (!byPairing.get(pairing)?.win) {
      byPairing.set(pairing, game);
    }
  }
  return fixtures(teams.length).map(([red, blue]) => ({
    red,
    blue,
    game: byPairing.get(key(sides[red], sides[blue])),
  }));
}

export interface TeamStanding {
  team: number;
  games: number;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Round robin table: most wins first, then goal difference, then goals scored. */
export function teamStandings(tournament: Tournament, fixtureList: Fixture[]): TeamStanding[] {
  const table = (tournament.teams ?? []).map((_, team) => ({
    team,
    games: 0,
    wins: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  }));
  const sides = (tournament.teams ?? []).map(sideOf);
  for (const { red, blue, game } of fixtureList) {
    if (!game?.win) {
      continue;
    }
    for (const team of [red, blue]) {
      const color = TEAM_COLORS.find((c) => sideOf(game.teams[c]) === sides[team]);
      if (!color) {
        continue;
      }
      const row = table[team];
      row.games++;
      row.wins += Number(game.win === color);
      row.goalsFor += teamScore(game, color);
      row.goalsAgainst += teamScore(game, opponent(color));
    }
  }
  return table.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor,
  );
}

/** Pairs (or single players) drawn at random for a round robin. */
export function drawTeams(
  players: string[],
  teamSize: number,
  random: () => number = Math.random,
): Lineup[] {
  const shuffled = players
    .map((player) => ({ player, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ player }) => player);
  const teams: Lineup[] = [];
  for (let i = 0; i + teamSize <= shuffled.length; i += teamSize) {
    teams.push(lineupFrom(shuffled.slice(i, i + teamSize)));
  }
  return teams;
}

/**
 * Repeatable random numbers (mulberry32), so a draw stays the same on screen until someone
 * asks for a new one.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
