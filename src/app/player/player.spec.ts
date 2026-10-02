import { makeGame } from '../game/game.testing';
import { countResults, rankPlayers } from './player';

describe('rankPlayers', () => {
  // a+b beat c+d twice; c (alone) beat d once; one game is still running.
  const games = [
    makeGame({ id: '1', end: '2017-11-03T10:05:00.000Z', win: 'red' }),
    makeGame({ id: '2', end: '2017-11-03T10:15:00.000Z', win: 'red' }),
    makeGame({ id: 'live' }),
  ];
  const single = makeGame({ id: '3', end: '2017-11-03T10:25:00.000Z', win: 'blue' });
  single.teams.red = {
    defence: { player: 'd', goals: 0, ownGoals: 0 },
    offence: { player: 'd', goals: 0, ownGoals: 0 },
  };
  single.teams.blue = {
    defence: { player: 'c', goals: 0, ownGoals: 0 },
    offence: { player: 'c', goals: 0, ownGoals: 0 },
  };
  games.push(single);

  it('counts results from finished games only', () => {
    const results = countResults(games);
    expect(results.get('a')).toEqual({ wins: 2, loses: 0 });
    expect(results.get('c')).toEqual({ wins: 1, loses: 2 });
    expect(results.get('d')).toEqual({ wins: 0, loses: 3 });
  });

  it('orders by win ratio, then name', () => {
    const ranked = rankPlayers(
      [
        { id: 'd', name: 'Dawid' },
        { id: 'c', name: 'Celina' },
        { id: 'b', name: 'Bolek' },
        { id: 'a', name: 'Adam' },
        { id: 'n', name: 'Newbie' },
      ],
      games,
    );

    expect(ranked.map((p) => p.name)).toEqual(['Adam', 'Bolek', 'Celina', 'Dawid', 'Newbie']);
    expect(ranked[2]).toMatchObject({ wins: 1, loses: 2, games: 3, winRatio: 33.33 });
    expect(ranked[4]).toMatchObject({ games: 0, winRatio: 0 });
  });
});
