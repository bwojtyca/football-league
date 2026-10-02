import { makeGame } from '../game/game.testing';
import { rankPlayers, results } from './player';
import { computeRatings } from './rating';

describe('rankPlayers', () => {
  // a+b beat c+d twice; c (alone) beat d once; one game is still running.
  const single = makeGame({
    id: '3',
    start: '2017-11-03T10:20:00.000Z',
    end: '2017-11-03T10:25:00.000Z',
    win: 'blue',
  });
  single.teams.red = {
    defence: { player: 'd', goals: 0, ownGoals: 0 },
    offence: { player: 'd', goals: 0, ownGoals: 0 },
  };
  single.teams.blue = {
    defence: { player: 'c', goals: 0, ownGoals: 0 },
    offence: { player: 'c', goals: 0, ownGoals: 0 },
  };
  single.players = ['d', 'c'];
  const games = [
    makeGame({
      id: '1',
      start: '2017-11-03T10:00:00.000Z',
      end: '2017-11-03T10:05:00.000Z',
      win: 'red',
    }),
    makeGame({
      id: '2',
      start: '2017-11-03T10:10:00.000Z',
      end: '2017-11-03T10:15:00.000Z',
      win: 'red',
    }),
    makeGame({ id: 'live', start: '2017-11-03T10:30:00.000Z' }),
    single,
  ];

  it('lists results of finished games, oldest first', () => {
    const byPlayer = results(games);
    expect(byPlayer.get('a')).toEqual(['W', 'W']);
    expect(byPlayer.get('c')).toEqual(['L', 'L', 'W']);
    expect(byPlayer.get('d')).toEqual(['L', 'L', 'L']);
  });

  it('orders by rating; players without games go last, by name', () => {
    const ranked = rankPlayers(
      [
        { id: 'd', name: 'Dawid' },
        { id: 'n', name: 'Newbie' },
        { id: 'c', name: 'Celina' },
        { id: 'b', name: 'Bolek' },
        { id: 'a', name: 'Adam' },
      ],
      games,
      computeRatings(games),
    );

    expect(ranked.map((p) => p.name)).toEqual(['Adam', 'Bolek', 'Celina', 'Dawid', 'Newbie']);
    expect(ranked[0]).toMatchObject({
      wins: 2,
      loses: 0,
      games: 2,
      winRatio: 100,
      provisional: true,
    });
    expect(ranked[2]).toMatchObject({ wins: 1, loses: 2, form: ['L', 'L', 'W'] });
    expect(ranked[4]).toMatchObject({ rating: null, change: null, games: 0 });
  });
});
