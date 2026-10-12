import { kitOf } from './kit';

describe('kitOf', () => {
  it('reads a stored kit', () => {
    expect(kitOf({ pattern: 'sash', c1: 'white', c2: 'red', num: 3 })).toEqual({
      pattern: 'sash',
      c1: 'white',
      c2: 'red',
      num: 3,
    });
  });

  it('keeps the shirt but drops a number it cannot print', () => {
    expect(kitOf({ pattern: 'plain', c1: 'black', c2: 'yellow', num: 120 })).toEqual({
      pattern: 'plain',
      c1: 'black',
      c2: 'yellow',
    });
    expect(kitOf({ pattern: 'plain', c1: 'black', c2: 'yellow', num: 2.5 })?.num).toBeUndefined();
  });

  it('ignores what is not a kit it can draw', () => {
    expect(kitOf(undefined)).toBeNull();
    expect(kitOf('red')).toBeNull();
    expect(kitOf({ pattern: 'dots', c1: 'red', c2: 'blue' })).toBeNull();
    expect(kitOf({ pattern: 'plain', c1: '#ff0000', c2: 'blue' })).toBeNull();
    expect(kitOf({ pattern: 'plain', c1: 'red' })).toBeNull();
  });
});
