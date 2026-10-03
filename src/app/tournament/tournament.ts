import {
  Game,
  GameMode,
  winsNeeded,
  Lineup,
  lineupOf,
  lineupPlayers,
  opponent,
  sideOf,
  TEAM_COLORS,
  TeamColor,
  teamScore,
} from '../game/game';
import { places } from '../shared/places';

/**
 * - `king`: king of the table. Winners stay at the table, the losers go to the back of the
 *   queue and the next in line challenge them.
 * - `dyp`: draw your partner. Each round draws who plays and with whom; the ranking is
 *   individual.
 * - `roundRobin`: fixed teams, everyone plays everyone once.
 * - `cup`: knockout; optionally two groups first, whose best two teams reach the semi-finals.
 * - `series`: two fixed teams play best of 3 or 5, swapping colours after each game.
 * - `open`: any games between the players, as many as they like; an individual table.
 * - `rotation`: everyone partners everyone once (rotating partners, like "Americano").
 */
export type TournamentFormat =
  'series' | 'open' | 'king' | 'dyp' | 'roundRobin' | 'rotation' | 'cup';

export const FORMATS: readonly TournamentFormat[] = [
  'series',
  'open',
  'king',
  'dyp',
  'roundRobin',
  'rotation',
  'cup',
];

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
  /** Round robin and cup: the teams, fixed when the tournament starts (in seeding order). */
  teams?: Lineup[];
  /** Cup: number of groups played before the knockout stage (0 or 2). */
  groups?: number;
  /** Series: best of 3 or 5. */
  bestOf?: number;
  end?: string;
  /** Deleted (hidden from the league, can be restored), with its games when `gamesDeleted`. */
  deleted?: boolean;
  gamesDeleted?: boolean;
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
  /** Place in the table, shared with the players tied with this one. */
  place: number;
  games: number;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Individual table: most wins first, then goal difference, then fewer games. */
export function playerStandings(players: string[], games: Game[]): PlayerStanding[] {
  const table = new Map(
    players.map((player) => [
      player,
      { player, place: 0, games: 0, wins: 0, goalsFor: 0, goalsAgainst: 0 },
    ]),
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
  const compare = (a: PlayerStanding, b: PlayerStanding) =>
    b.wins - a.wins ||
    b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
    a.games - b.games;
  return withPlaces([...table.values()].sort(compare), compare);
}

/** Sets the places of a sorted table: rows the comparison finds equal share one. */
export function withPlaces<T extends { place: number }>(
  rows: T[],
  compare: (a: T, b: T) => number,
): T[] {
  places(rows, (a, b) => compare(a, b) === 0).forEach(
    (place, index) => (rows[index].place = place),
  );
  return rows;
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
  /** Place in the table, shared with the teams tied with this one. */
  place: number;
  games: number;
  wins: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Order of a team table: most wins first, then goal difference, then goals scored. */
export function compareTeams(a: TeamStanding, b: TeamStanding): number {
  return (
    b.wins - a.wins ||
    b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
    b.goalsFor - a.goalsFor
  );
}

/** Round robin table, in the order of `compareTeams`. */
export function teamStandings(tournament: Tournament, fixtureList: Fixture[]): TeamStanding[] {
  const table = (tournament.teams ?? []).map((_, team) => ({
    team,
    place: 0,
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
  return withPlaces(table.sort(compareTeams), compareTeams);
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

export interface SeriesState {
  /** Games won by each of the two teams. */
  wins: [number, number];
  /** Index of the team that took the series. */
  winner?: number;
  running?: Game;
  /** The next game: colours swap every game, players keep their last positions. */
  next?: Record<TeamColor, Lineup>;
  /** Number of the next (or running) game, from 1. */
  number: number;
}

/** Where a best-of series stands, from its games. */
export function seriesState(tournament: Tournament, games: Game[]): SeriesState {
  const teams = tournament.teams ?? [];
  const sides = teams.map(sideOf);
  const finished = games.filter((game) => game.win).sort(byEnd);
  const wins: [number, number] = [0, 0];
  for (const game of finished) {
    const index = sides.indexOf(sideOf(game.teams[game.win!]));
    if (index >= 0) {
      wins[index]++;
    }
  }
  const needed = winsNeeded(tournament.bestOf ?? 3);
  const winner = wins.findIndex((count) => count >= needed);
  const running = games.find((game) => !game.end);
  const number = finished.length + 1;
  let next: SeriesState['next'];
  if (!running && winner < 0 && !tournament.end && teams.length === 2) {
    // The latest lineup of each team: positions swapped in a game stay swapped.
    const last = finished.at(-1);
    const lineup = (index: number) => {
      const color = last && TEAM_COLORS.find((c) => sideOf(last.teams[c]) === sides[index]);
      return color ? lineupOf(last.teams[color]) : teams[index];
    };
    const [first, second] = number % 2 ? [0, 1] : [1, 0];
    next = { red: lineup(first), blue: lineup(second) };
  }
  return { wins, winner: winner < 0 ? undefined : winner, running, next, number };
}

/**
 * Rotating partners: games in which every two players partner each other once (one pair
 * plays twice when the number of pairs is odd). Those who played least go first and
 * opponents are spread out; `random` (seeded per tournament) keeps it the same everywhere.
 */
export function rotationSchedule(
  players: string[],
  random: () => number,
): Record<TeamColor, Lineup>[] {
  const key = (a: string, b: string) => [a, b].sort().join('+');
  const shuffle = <T>(items: T[]) =>
    items
      .map((item) => ({ item, order: random() }))
      .sort((a, b) => a.order - b.order)
      .map(({ item }) => item);
  const allPairs = shuffle(
    players.flatMap((a, i) => players.slice(i + 1).map((b) => [a, b] as [string, string])),
  );
  const remaining = new Set(allPairs.map(([a, b]) => key(a, b)));
  const played = new Map(players.map((p) => [p, 0]));
  const met = new Map<string, number>();
  const games: Record<TeamColor, Lineup>[] = [];
  const load = ([a, b]: [string, string]) => played.get(a)! + played.get(b)!;
  const clash = ([a, b]: [string, string], [c, d]: [string, string]) =>
    [key(a, c), key(a, d), key(b, c), key(b, d)].reduce((sum, k) => sum + (met.get(k) ?? 0), 0);

  while (remaining.size) {
    const open = allPairs.filter(([a, b]) => remaining.has(key(a, b)));
    const first = [...open].sort((x, y) => load(x) - load(y))[0];
    const disjoint = (pair: [string, string]) => !pair.some((p) => first.includes(p));
    // Prefer a pair still to play; otherwise repeat one, to fill the last game.
    const pool = open.filter(disjoint).length ? open.filter(disjoint) : allPairs.filter(disjoint);
    if (!pool.length) {
      break;
    }
    const second = [...pool].sort(
      (x, y) => load(x) - load(y) || clash(first, x) - clash(first, y),
    )[0];
    games.push({ red: lineupFrom(first), blue: lineupFrom(second) });
    for (const pair of [first, second]) {
      remaining.delete(key(pair[0], pair[1]));
      pair.forEach((p) => played.set(p, played.get(p)! + 1));
    }
    for (const a of first) {
      for (const b of second) {
        met.set(key(a, b), (met.get(key(a, b)) ?? 0) + 1);
      }
    }
  }
  return games;
}

/** A number from a string, to seed a tournament's own random draws. */
export function seedOf(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  }
  return hash >>> 0;
}

export interface LineupFixture {
  red: Lineup;
  blue: Lineup;
  game?: Game;
}

/** The rotating partners schedule of a tournament, with the game of each pairing. */
export function rotationFixtures(tournament: Tournament, games: Game[]): LineupFixture[] {
  const players = [...presentPlayers(tournament.entries).keys()];
  const schedule = rotationSchedule(players, seededRandom(seedOf(tournament.id)));
  const pairing = (red: Lineup, blue: Lineup) => [sideOf(red), sideOf(blue)].sort().join(' vs ');
  const used = new Set<string>();
  return schedule.map(({ red, blue }) => {
    // A repeated pairing gets the next of its games.
    const game = games.find(
      (g) =>
        !used.has(g.id) &&
        pairing(lineupOf(g.teams.red), lineupOf(g.teams.blue)) === pairing(red, blue),
    );
    if (game) {
      used.add(game.id);
    }
    return { red, blue, game };
  });
}
