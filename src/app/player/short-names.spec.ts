import { shortNames } from './short-names';

describe('shortNames', () => {
  it('keeps first names when they are unique, adds an initial when not', () => {
    const names = new Map([
      ['a', 'Krzysztof-Maksymilian Brzęczyszczykiewicz'],
      ['b', 'Ala Nowak'],
      ['c', 'Ala Kowalska'],
      ['d', 'Bo'],
      ['e', 'Ola Nowak'],
      ['f', 'Ola Nowicka'],
    ]);
    expect(Object.fromEntries(shortNames(names))).toEqual({
      a: 'Krzysztof',
      b: 'Ala N.',
      c: 'Ala K.',
      d: 'Bo',
      e: 'Ola Nowak',
      f: 'Ola Nowicka',
    });
  });
});
