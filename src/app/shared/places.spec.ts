import { places } from './places';

describe('places', () => {
  const same = (a: number, b: number) => a === b;

  it('numbers rows without ties one by one', () => {
    expect(places([9, 7, 5], same)).toEqual([1, 2, 3]);
  });

  it('shares a place on a tie and skips the next ones', () => {
    expect(places([9, 9, 7, 5, 5, 5, 1], same)).toEqual([1, 1, 3, 4, 4, 4, 7]);
  });

  it('handles an empty table', () => {
    expect(places([], same)).toEqual([]);
  });
});
