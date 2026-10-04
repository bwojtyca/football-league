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

  it('makes losing to a big potato hurt, three times over for the leaders', () => {
    const games = [game(0, 8, 3), game(10, 8, 3), game(20, 8, 3), game(30, 2, 8)];
    const ranking = potatoRanking(games);
    // c+d lost three times: 3 points each, c is the potato. Then a+b, the leaders (best Elo
    // after three wins), lose to them: favourites, but not clear ones.
    const loss =
      POTATO_POINTS.loss + POTATO_POINTS.lossToPotato + Math.ceil(3 * POTATO_POINTS.potatoShare);
    expect(ranking.find((row) => row.player === 'a')?.points).toBe(loss * POTATO_POINTS.leaderLoss);
    expect(ranking[0].player).toBe('a');
  });

  it('does not triple the loss of a teammate who is not a leader', () => {
    // a and b lead after three wins, c is the potato; then a and d beat b and c.
    const games = [game(0, 8, 3), game(10, 8, 3), game(20, 8, 3)];
    const mixed = game(30, 8, 2);
    mixed.teams.red.offence.player = 'd';
    mixed.teams.blue.defence.player = 'b';
    mixed.teams.blue.offence.player = 'c';
    mixed.players = ['a', 'd', 'b', 'c'];
    const ranking = potatoRanking([...games, mixed]);
    const points = (id: string) => ranking.find((row) => row.player === id)?.points;
    // c's loss is plain, b's (a leader) three times as much.
    expect(points('c')).toBe(3 + POTATO_POINTS.loss);
    expect(points('b')).toBe(POTATO_POINTS.loss * POTATO_POINTS.leaderLoss);
  });
});
