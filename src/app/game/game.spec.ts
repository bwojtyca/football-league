import { formatDuration, teamOf, teamPlayers, teamScore, winnerOf } from './game';
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

  it('formats durations as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65.9)).toBe('01:05');
    expect(formatDuration(754)).toBe('12:34');
    expect(formatDuration(-3)).toBe('00:00');
  });
});
