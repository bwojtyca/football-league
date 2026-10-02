import { makeGame } from '../game/game.testing';
import { computeRatings, K_FACTOR, START_RATING, winChance } from './rating';

describe('computeRatings', () => {
  it('moves both teams by half of K when ratings are equal', () => {
    const game = makeGame({ end: '2017-11-03T10:05:00.000Z', win: 'red' });
    const { current, changes } = computeRatings([game]);

    expect(current.get('a')).toBe(START_RATING + K_FACTOR / 2);
    expect(current.get('c')).toBe(START_RATING - K_FACTOR / 2);
    expect(changes.get(game.id)?.get('b')).toBe(K_FACTOR / 2);
  });

  it('gives less for beating a weaker team, and ignores unfinished games', () => {
    const first = makeGame({
      id: '1',
      start: '2017-11-03T10:00:00.000Z',
      end: '2017-11-03T10:05:00.000Z',
      win: 'red',
    });
    const second = makeGame({
      id: '2',
      start: '2017-11-03T10:10:00.000Z',
      end: '2017-11-03T10:15:00.000Z',
      win: 'red',
    });
    const live = makeGame({ id: '3', start: '2017-11-03T10:20:00.000Z' });
    const { changes, history } = computeRatings([second, live, first]);

    expect(changes.get('2')!.get('a')!).toBeLessThan(changes.get('1')!.get('a')!);
    expect(history.get('a')).toHaveLength(2);
    expect(changes.has('3')).toBe(false);
  });

  it('turns rating gaps into win chances', () => {
    expect(winChance(1500, 1500)).toBe(0.5);
    expect(winChance(1600, 1400)).toBeCloseTo(0.76, 2);
  });
});
