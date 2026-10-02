import { Game, TeamColor } from '../game/game';
import { makeGame } from '../game/game.testing';
import {
  drawRound,
  fixtures,
  kingState,
  playerStandings,
  roundRobinFixtures,
  teamStandings,
  Tournament,
} from './tournament';

const T0 = '2026-10-02T12:00:00.000Z';

function tournament(overrides: Partial<Tournament>): Tournament {
  return {
    id: 't',
    league: 'l',
    name: 'Test',
    format: 'king',
    created: T0,
    mode: { target: 5 },
    teamSize: 2,
    entries: [],
    ...overrides,
  };
}

/** A game between two lineups ([defence, offence]); `minute` orders the games. */
function play(minute: number, red: string[], blue: string[], win?: TeamColor): Game {
  const slot = (player: string, goals: number) => ({ player, goals, ownGoals: 0 });
  const at = (m: number) => new Date(Date.parse(T0) + m * 60_000).toISOString();
  return makeGame({
    id: `g${minute}`,
    players: [...new Set([...red, ...blue])],
    start: at(minute),
    ...(win && { end: at(minute + 1), win }),
    teams: {
      red: { defence: slot(red[0], win === 'red' ? 5 : 0), offence: slot(red[1] ?? red[0], 0) },
      blue: {
        defence: slot(blue[0], win === 'blue' ? 5 : 0),
        offence: slot(blue[1] ?? blue[0], 0),
      },
    },
  });
}

const join = (...players: string[]) => players.map((player) => ({ player, at: T0 }));

describe('kingState', () => {
  const king = tournament({ entries: join('a', 'b', 'c', 'd', 'e', 'f') });

  it('starts with the first four in line', () => {
    const state = kingState(king, []);
    expect(state.next).toEqual({
      red: { defence: 'a', offence: 'b' },
      blue: { defence: 'c', offence: 'd' },
    });
    expect(state.queue).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('keeps the winners at the table and sends the losers to the back', () => {
    const games = [play(0, ['a', 'b'], ['c', 'd'], 'red'), play(2, ['a', 'b'], ['e', 'f'], 'red')];
    const state = kingState(king, games);
    expect(state.champions).toEqual({
      lineup: { defence: 'a', offence: 'b' },
      color: 'red',
      streak: 2,
    });
    expect(state.queue).toEqual(['c', 'd', 'e', 'f']);
    expect(state.next?.blue).toEqual({ defence: 'c', offence: 'd' });
    expect(state.record?.streak).toBe(2);
  });

  it('crowns the challengers when they win', () => {
    const games = [play(0, ['a', 'b'], ['c', 'd'], 'red'), play(2, ['a', 'b'], ['e', 'f'], 'blue')];
    const state = kingState(king, games);
    expect(state.champions?.lineup).toEqual({ defence: 'e', offence: 'f' });
    expect(state.champions?.streak).toBe(1);
    expect(state.queue).toEqual(['c', 'd', 'a', 'b']);
  });

  it('waits while a game is played, and seats newcomers at the back', () => {
    const late = tournament({
      entries: [...join('a', 'b', 'c', 'd'), { player: 'g', at: '2026-10-02T12:00:30.000Z' }],
    });
    const state = kingState(late, [play(0, ['a', 'b'], ['c', 'd'])]);
    expect(state.running?.id).toBe('g0');
    expect(state.next).toBeUndefined();
    expect(state.queue).toEqual(['g']);
  });

  it('lets champions who leave give up the table', () => {
    const left = tournament({
      entries: [...join('a', 'b', 'c', 'd', 'e', 'f'), { player: 'a', at: T0, out: true }],
    });
    const state = kingState(left, [play(0, ['a', 'b'], ['c', 'd'], 'red')]);
    expect(state.champions).toBeUndefined();
    expect(state.queue).toEqual(['e', 'f', 'c', 'b', 'd']);
  });
});

describe('drawRound', () => {
  it('picks those who played least and pairs partners who were not together yet', () => {
    const games = [play(0, ['a', 'b'], ['c', 'd'], 'red')];
    const round = drawRound(['a', 'b', 'c', 'd', 'e'], games, new Map(), () => 0.5)!;
    const players = [round.red, round.blue].flatMap((team) => [team.defence, team.offence]);
    expect(players).toContain('e');
    const pairs = [round.red, round.blue].map((team) => [team.defence, team.offence].sort().join());
    expect(pairs).not.toContain('a,b');
    expect(pairs).not.toContain('c,d');
  });

  it('needs four players', () => {
    expect(drawRound(['a', 'b', 'c'], [], new Map())).toBeUndefined();
  });

  it('ranks players by wins', () => {
    const games = [play(0, ['a', 'b'], ['c', 'd'], 'red'), play(2, ['a', 'c'], ['b', 'd'], 'red')];
    const table = playerStandings(['a', 'b', 'c', 'd'], games);
    expect(table.map((row) => [row.player, row.wins])).toEqual([
      ['a', 2],
      ['b', 1],
      ['c', 1],
      ['d', 0],
    ]);
  });
});

describe('round robin', () => {
  it('pairs every team with every other once', () => {
    for (const count of [3, 4, 5, 6]) {
      const pairs = fixtures(count).map(([x, y]) => [x, y].sort().join());
      expect(pairs.length).toBe((count * (count - 1)) / 2);
      expect(new Set(pairs).size).toBe(pairs.length);
    }
  });

  it('finds the games of each pairing and builds the table', () => {
    const rr = tournament({
      format: 'roundRobin',
      teams: [
        { defence: 'a', offence: 'b' },
        { defence: 'c', offence: 'd' },
        { defence: 'e', offence: 'f' },
      ],
    });
    // Colours do not matter: c+d play red against a+b.
    const games = [play(0, ['d', 'c'], ['a', 'b'], 'red')];
    const list = roundRobinFixtures(rr, games);
    expect(list.filter((f) => f.game).length).toBe(1);
    const table = teamStandings(rr, list);
    expect(table[0]).toMatchObject({ team: 1, wins: 1, goalsFor: 5 });
    expect(table.find((row) => row.team === 0)).toMatchObject({ games: 1, wins: 0 });
  });
});
