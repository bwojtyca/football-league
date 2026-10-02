import { Game } from '../game/game';
import { makeGame } from '../game/game.testing';
import { POTATO_POINTS, potatoRanking } from './potato';

/** a+b (red) against c+d (blue). */
function game(minute: number, red: number, blue: number): Game {
  const at = (m: number) =>
    new Date(Date.parse('2026-10-02T10:00:00.000Z') + m * 60_000).toISOString();
  const g = makeGame({
    id: `g${minute}`,
    start: at(minute),
    end: at(minute + 5),
    win: red > blue ? 'red' : 'blue',
  });
  g.teams.red.defence.goals = red;
  g.teams.blue.defence.goals = blue;
  return g;
}

describe('potatoRanking', () => {
  it('makes the team that keeps losing the potato', () => {
    const games = [game(0, 8, 3), game(10, 8, 0), game(20, 8, 5)];
    const ranking = potatoRanking(games);
    const c = ranking.find((row) => row.player === 'c')!;
    // 1 + 1 (+2 for the 8:0) + 1.
    expect(c.points).toBe(3 * POTATO_POINTS.loss + POTATO_POINTS.shutoutLoss);
    expect(c.isPotato).toBe(true);
    expect(ranking.find((row) => row.player === 'a')?.points).toBe(0);
  });

  it('punishes losing to the potato', () => {
    const games = [game(0, 8, 3), game(10, 8, 3), game(20, 8, 3), game(30, 2, 8)];
    const ranking = potatoRanking(games);
    const a = ranking.find((row) => row.player === 'a')!;
    // Lost to c+d, the potatoes (after three wins a+b are favourites, but not clear ones).
    expect(a.points).toBe(POTATO_POINTS.loss + POTATO_POINTS.lossToPotato);
    expect(ranking[0].player).toBe('a');
  });
});
