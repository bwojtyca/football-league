import { Game, GameEvent } from '../game/game';
import { makeGame } from '../game/game.testing';
import { computeRatings } from '../player/rating';
import {
  gameFacts,
  gameSeconds,
  goalMoments,
  headToHead,
  leagueStats,
  lineStats,
  modeRecords,
  playerTime,
  ratingTimeline,
  tournamentSummary,
} from './stats';

/** A finished game, red a+b against blue c+d, with the given score and length in minutes. */
function played(
  id: string,
  day: number,
  [red, blue]: [number, number],
  minutes: number,
  extra: Partial<Game> = {},
): Game {
  const start = new Date(Date.UTC(2017, 10, day, 10));
  const game = makeGame({
    id,
    start: start.toISOString(),
    end: new Date(start.getTime() + minutes * 60_000).toISOString(),
    win: red > blue ? 'red' : 'blue',
    ...extra,
  });
  game.teams.red.defence.goals = red;
  game.teams.blue.offence.goals = blue;
  return game;
}

const goal = (
  at: number,
  team: 'red' | 'blue',
  player: string,
): Exclude<GameEvent, { type: 'swap' }> => ({
  at: at * 60_000,
  type: 'goal',
  team,
  position: team === 'red' ? 'defence' : 'offence',
  player,
});

describe('leagueStats', () => {
  const games = [
    played('a', 1, [8, 0], 4),
    played('b', 2, [3, 8], 10),
    played('c', 3, [8, 6], 6),
    makeGame({ id: 'running' }),
  ];
  const stats = leagueStats(games);

  it('counts finished games, goals and time', () => {
    expect(stats.games).toBe(3);
    expect(stats.goals).toBe(33);
    expect(stats.seconds).toBe(20 * 60);
    expect(stats.shutouts).toBe(1);
    expect(stats.colors).toEqual({ red: 2, blue: 1 });
    expect(stats.positions).toEqual({ games: 3, defence: 19, offence: 14 });
    expect(stats.months).toEqual([{ month: '2017-11', games: 3 }]);
  });

  it('finds the records', () => {
    expect(stats.records.longest).toEqual({ game: games[1], value: 600 });
    expect(stats.records.shortest).toEqual({ game: games[0], value: 240 });
    expect(stats.records.biggestWin).toEqual({ game: games[0], value: 8 });
    expect(stats.records.mostGoals).toEqual({ game: games[2], value: 14 });
    expect(stats.records.streak).toEqual({ player: 'a', wins: 1 });
  });

  it('leaves pauses out of the play time', () => {
    expect(gameSeconds({ ...games[0], pausedFor: 60_000 })).toBe(180);
  });
});

describe('goal times and moments', () => {
  // Red a+b against blue c+d: 1:0 a, 1:1 d, 2:1 a, 2:2 d, 3:2 b; red wins to 3.
  const logged = played('log', 5, [3, 2], 10, {
    mode: { target: 3 },
    events: [
      goal(1, 'red', 'a'),
      goal(3, 'blue', 'd'),
      goal(5, 'red', 'a'),
      goal(7, 'blue', 'd'),
      goal(9, 'red', 'b'),
    ],
  });

  it('tells what each goal of a player meant', () => {
    expect(goalMoments([logged], 'a')).toEqual({
      games: 1,
      goals: 2,
      first: 1,
      equalizers: 0,
      goAhead: 2,
      winners: 0,
      minute: 3,
      thirds: [1, 1, 0],
    });
    expect(goalMoments([logged], 'd')).toMatchObject({ goals: 2, equalizers: 2, winners: 0 });
    expect(goalMoments([logged], 'b')).toMatchObject({ goals: 1, goAhead: 1, winners: 1 });
  });

  it('times the goals of the league', () => {
    expect(leagueStats([logged]).log).toEqual({
      games: 1,
      goals: 5,
      firstGoal: 60_000,
      gap: 120_000,
      thirds: [2, 1, 2],
    });
  });
});

describe('headToHead', () => {
  const games = [played('x', 1, [8, 2], 5), played('y', 2, [4, 8], 5)];
  const swapped = played('z', 3, [8, 5], 5);
  swapped.teams.red.offence.player = 'c';
  swapped.teams.blue.defence.player = 'b';

  it('counts games against each other and together', () => {
    const h2h = headToHead([...games, swapped], 'a', 'c');
    expect(h2h.against).toMatchObject({ games: 2, wins: [1, 1], goals: [12, 10] });
    expect(h2h.together).toMatchObject({ games: 1, wins: 1, goals: 8, conceded: 5 });
  });
});

describe('player rules, time and the rating timeline', () => {
  const games = [
    played('p', 1, [8, 1], 5),
    played('q', 2, [5, 3], 3, { mode: { target: 5, winBy: 2 } }),
    played('r', 3, [6, 8], 7),
  ];

  it('groups a player’s games by rules', () => {
    expect(modeRecords(games, 'a')).toEqual([
      { mode: { target: 8 }, games: 2, wins: 1 },
      { mode: { target: 5, winBy: 2 }, games: 1, wins: 1 },
    ]);
  });

  it('adds up the time played, this month too', () => {
    expect(playerTime(games, 'a', new Date(Date.UTC(2017, 10, 20)))).toEqual({
      seconds: 15 * 60,
      games: 3,
      month: { seconds: 15 * 60, games: 3 },
    });
  });

  it('follows every rating game by game', () => {
    const timeline = ratingTimeline(games, computeRatings(games));
    expect(timeline.get('a')).toHaveLength(3);
    expect(timeline.get('a')![0]).toBe(1512);
    expect(timeline.get('a')![1]).toBeGreaterThan(1512);
  });
});

describe('gameFacts', () => {
  const games = [
    played('long', 1, [8, 7], 12),
    played('short', 2, [8, 0], 2),
    played('mid', 3, [8, 4], 6),
    played('mid2', 4, [8, 5], 7),
    played('mid3', 5, [8, 6], 8),
  ];

  it('mentions the top places only', () => {
    const facts = gameFacts(games[1], games);
    expect(facts).toContainEqual({ key: 'facts.shortest', params: { n: 1 } });
    expect(facts).toContainEqual({ key: 'facts.biggestWin', params: { n: 1 } });
    expect(facts.find((fact) => fact.key === 'facts.longest')).toBeUndefined();
    expect(facts.at(-1)).toEqual({ key: 'facts.duration', params: { time: 120, average: 420 } });
  });
});

describe('tournamentSummary', () => {
  // a+b beat c+d twice (8:2, 8:4), then c+d win 8:7.
  const games = [
    played('t1', 1, [8, 2], 5),
    played('t2', 2, [8, 4], 9),
    played('t3', 3, [7, 8], 6),
  ];

  it('names the best players and the records', () => {
    const summary = tournamentSummary(games);
    expect(summary).toMatchObject({ games: 3, seconds: 20 * 60, goals: 37 });
    expect(summary.scorers).toEqual({ players: ['a'], goals: 23 });
    expect(summary.mostWins).toEqual({ players: ['a', 'b'], wins: 2 });
    // a conceded 14 in 3 games in defence, c conceded 23.
    expect(summary.defence).toEqual({ players: ['a'], conceded: 14 / 3 });
    expect(summary.longest?.game.id).toBe('t2');
    expect(summary.biggestWin?.game.id).toBe('t1');
  });
});

describe('lineStats', () => {
  // Red a+b against blue c+d; goals told by position, by rod and by figure, one own goal.
  const game = played('lines', 6, [3, 1], 5, {
    events: [
      goal(1, 'red', 'a'),
      { ...goal(2, 'red', 'a'), rod: 'goalie' },
      {
        at: 180_000,
        type: 'goal',
        team: 'red',
        position: 'offence',
        player: 'b',
        rod: 'attack',
        man: 2,
      },
      {
        at: 240_000,
        type: 'own',
        team: 'red',
        position: 'defence',
        player: 'a',
        rod: 'defence',
        man: 1,
      },
    ],
  });

  it('counts what is known and what is not', () => {
    const all = lineStats([game]);
    expect(all).toMatchObject({ known: 3, unknown: 1 });
    expect(all.rods.goalie).toEqual({ goals: 1, own: 0, men: [0] });
    expect(all.rods.attack).toEqual({ goals: 1, own: 0, men: [0, 1, 0] });
    expect(all.rods.defence).toEqual({ goals: 0, own: 1, men: [0, 0] });
    expect(lineStats([game], 'b')).toMatchObject({ known: 1, unknown: 0 });
  });
});
