import { makeGame } from '../game.testing';
import { calculateStats, ratio } from './player-stats';

describe('calculateStats', () => {
  // a+b (red) beat c+d (blue) in 5 minutes; a scored 3 as defender, b 5 as attacker.
  const win = makeGame({ id: 'win', end: '2017-11-03T10:05:00.000Z', win: 'red' });
  win.teams.red.defence.goals = 3;
  win.teams.red.offence.goals = 5;
  win.teams.blue.offence.goals = 2;

  // a alone (blue) lost to c+d (red) in 10 minutes, with one own goal.
  const loss = makeGame({
    id: 'loss',
    players: ['c', 'd', 'a'],
    start: '2017-11-04T10:00:00.000Z',
    end: '2017-11-04T10:10:00.000Z',
    win: 'red',
  });
  loss.teams = {
    red: {
      defence: { player: 'c', goals: 4, ownGoals: 0 },
      offence: { player: 'd', goals: 3, ownGoals: 0 },
    },
    blue: {
      defence: { player: 'a', goals: 1, ownGoals: 1 },
      offence: { player: 'a', goals: 2, ownGoals: 0 },
    },
  };

  const unfinished = makeGame({ id: 'live' });
  unfinished.teams.red.defence.goals = 7;

  const stats = calculateStats([win, loss, unfinished], 'a');

  it('counts finished games only', () => {
    expect(stats.games).toEqual({ total: 2, wins: 1, loses: 1 });
    expect(stats.time).toEqual({ total: 900, wins: 300, loses: 600 });
  });

  it('splits goals by position and colour', () => {
    expect(stats.goals).toEqual({ total: 6, own: 1 });
    expect(stats.positions.defender).toEqual({ games: 2, wins: 1, loses: 1, goals: 4, own: 1 });
    expect(stats.positions.attacker).toEqual({ games: 1, wins: 0, loses: 1, goals: 2, own: 0 });
    expect(stats.colors.red).toEqual({ games: 1, wins: 1, loses: 0, goals: 3, own: 0 });
    expect(stats.colors.blue).toEqual({ games: 1, wins: 0, loses: 1, goals: 3, own: 1 });
  });

  it('tracks allies and enemies, best win ratio first', () => {
    expect(stats.allies).toEqual([{ playerId: 'b', games: 1, wins: 1, loses: 0, timePlayed: 300 }]);
    expect(stats.enemies.map((e) => [e.playerId, e.games, e.wins])).toEqual([
      ['c', 2, 1],
      ['d', 2, 1],
    ]);
  });

  it('avoids dividing by zero', () => {
    expect(ratio(3, 0)).toBe(0);
    expect(ratio(3, 2)).toBe(1.5);
  });
});
