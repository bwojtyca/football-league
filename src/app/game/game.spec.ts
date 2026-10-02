import {
  decidedWinner,
  formatDuration,
  Game,
  seriesScore,
  teamOf,
  teamPlayers,
  teamScore,
  timeLeft,
  winnerOf,
} from './game';
import { makeGame } from './game.testing';

describe('game', () => {
  it('credits own goals to the opponent', () => {
    const game = makeGame();
    game.teams.red.offence.goals = 3;
    game.teams.red.defence.goals = 1;
    game.teams.blue.defence.ownGoals = 2;
    game.teams.red.offence.ownGoals = 1;

    expect(teamScore(game, 'red')).toBe(6);
    expect(teamScore(game, 'blue')).toBe(1);
  });

  it('has a winner once a team reaches 8 goals', () => {
    const game = makeGame();
    game.teams.blue.offence.goals = 7;
    expect(winnerOf(game)).toBeUndefined();

    game.teams.red.defence.ownGoals = 1;
    expect(winnerOf(game)).toBe('blue');
  });

  it('lists a single-player team once', () => {
    const game = makeGame();
    game.teams.blue.offence.player = 'c';

    expect(teamPlayers(game.teams.red)).toEqual(['a', 'b']);
    expect(teamPlayers(game.teams.blue)).toEqual(['c']);
    expect(teamOf(game, 'c')).toBe('blue');
    expect(teamOf(game, 'x')).toBeUndefined();
  });

  it('credits own goals to the other team', () => {
    const game = makeGame();
    game.teams.blue.defence.ownGoals = 1;
    game.teams.red.offence.goals = 1;

    expect(teamScore(game, 'red')).toBe(2);
    expect(teamScore(game, 'blue')).toBe(0);
  });

  it('formats durations as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65.9)).toBe('01:05');
    expect(formatDuration(754)).toBe('12:34');
    expect(formatDuration(-3)).toBe('00:00');
  });
});

describe('modes', () => {
  const score = (red: number, blue: number, mode?: Game['mode']) =>
    makeGame({
      mode,
      teams: {
        red: {
          defence: { player: 'a', goals: red, ownGoals: 0 },
          offence: { player: 'b', goals: 0, ownGoals: 0 },
        },
        blue: {
          defence: { player: 'c', goals: blue, ownGoals: 0 },
          offence: { player: 'd', goals: 0, ownGoals: 0 },
        },
      },
    });

  it('plays old games to 8', () => {
    expect(winnerOf(score(7, 3))).toBeUndefined();
    expect(winnerOf(score(8, 7))).toBe('red');
  });

  it('needs a two-goal lead, with no cap unless one is set', () => {
    const winBy2 = { target: 8, winBy: 2 };
    expect(winnerOf(score(8, 6, winBy2))).toBe('red');
    expect(winnerOf(score(8, 7, winBy2))).toBeUndefined();
    expect(winnerOf(score(9, 7, winBy2))).toBe('red');
    expect(winnerOf(score(90, 89, winBy2))).toBeUndefined();
    expect(winnerOf(score(88, 90, winBy2))).toBe('blue');
    // Stage 2 games capped at 11.
    expect(winnerOf(score(10, 11, { ...winBy2, max: 11 }))).toBe('blue');
  });

  it('ends a timed game with the team ahead, or waits for a golden goal', () => {
    const start = Date.parse('2017-11-03T10:00:00.000Z');
    const afterTime = start + 5 * 60_000 + 1;
    expect(decidedWinner(score(2, 1, { target: 8, minutes: 5 }), start + 60_000)).toBeUndefined();
    expect(decidedWinner(score(2, 1, { target: 8, minutes: 5 }), afterTime)).toBe('red');
    expect(decidedWinner(score(2, 2, { target: 8, minutes: 5 }), afterTime)).toBeUndefined();
    expect(timeLeft(score(0, 0, { target: 8, minutes: 5 }), start + 60_000)).toBe(240);
  });

  it('counts series wins by players, whatever their colour', () => {
    const series = { id: 's', bestOf: 3, game: 3 };
    const first = { ...score(8, 2), win: 'red' as const };
    // Second game: colours swapped, a+b now play blue and win again.
    const second = makeGame({
      teams: { red: first.teams.blue, blue: first.teams.red },
      win: 'blue',
    });
    const third = makeGame({ series, teams: { red: first.teams.red, blue: first.teams.blue } });
    expect(seriesScore(third, [first, second])).toEqual({ red: 2, blue: 0, winner: 'red' });
    expect(seriesScore(third, [first])).toEqual({ red: 1, blue: 0, winner: undefined });
  });
});
