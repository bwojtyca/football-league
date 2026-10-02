import { rankPlayers } from './player';

describe('rankPlayers', () => {
  it('orders by win ratio, then name', () => {
    const ranked = rankPlayers([
      { id: '1', name: 'Zenek', wins: 1, loses: 1 },
      { id: '2', name: 'Adam', wins: 1, loses: 1 },
      { id: '3', name: 'Mateusz', wins: 146, loses: 192 },
      { id: '4', name: 'Newbie', wins: 0, loses: 0 },
      { id: '5', name: 'Champ', wins: 2, loses: 1 },
    ]);

    expect(ranked.map((p) => p.name)).toEqual(['Champ', 'Adam', 'Zenek', 'Mateusz', 'Newbie']);
    expect(ranked.find((p) => p.name === 'Mateusz')).toMatchObject({ games: 338, winRatio: 43.2 });
    expect(ranked.find((p) => p.name === 'Newbie')).toMatchObject({ games: 0, winRatio: 0 });
  });
});
