import { percentages } from './format';

describe('percentages', () => {
  it('adds up to 100', () => {
    expect(percentages([30, 34, 37])).toEqual([30, 34, 36]);
    expect(percentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(percentages([0, 0, 0])).toEqual([0, 0, 0]);
  });
});
