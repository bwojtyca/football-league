import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  const pipe = new HighlightPipe();

  it('highlights every searched word, ignoring case', () => {
    expect(pipe.transform('Mateusz Kowalski', 'mat kow')).toBe(
      '<span class="highlight">Mat</span>eusz <span class="highlight">Kow</span>alski',
    );
  });

  it('escapes HTML in names', () => {
    expect(pipe.transform('<b>Bob</b>', 'bob')).toBe(
      '&lt;b&gt;<span class="highlight">Bob</span>&lt;/b&gt;',
    );
  });

  it('ignores searches that are not text', () => {
    expect(pipe.transform('Bob', { id: '1', name: 'Bob' })).toBe('Bob');
    expect(pipe.transform('Bob', '(')).toBe('Bob');
  });
});
