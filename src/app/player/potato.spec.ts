import { Game } from '../game/game';
import { makeGame } from '../game/game.testing';
import { POTATO_GAMES, POTATO_POINTS, potatoRanking } from './potato';

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

/** a+b beat c+d three times: c is the potato (3 points). */
const opening = [game(0, 8, 3), game(10, 8, 3), game(20, 8, 3)];

function points(games: Game[]) {
  const ranking = potatoRanking(games);
  return (id: string) => ranking.find((row) => row.player === id)?.points;
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

  it('makes a loss to the potato hurt', () => {
    // a+b lose to the potato's team (favourites, but not clear ones: no extra for that).
    const score = points([...opening, game(30, 2, 8)]);
    const toPotato = POTATO_POINTS.lossToPotato + Math.ceil(3 * POTATO_POINTS.potatoShare);
    expect(score('a')).toBe(3 * POTATO_POINTS.win + POTATO_POINTS.loss + toPotato);
  });

  it('makes clear favourites pay for losing', () => {
    // After six wins a+b have a 67% chance; they lose 5:8 to the potato's team.
    const wins = Array.from({ length: 6 }, (_, i) => game(i * 10, 8, 3));
    const score = points([...wins, game(60, 5, 8)]);
    const toPotato = POTATO_POINTS.lossToPotato + Math.ceil(6 * POTATO_POINTS.potatoShare);
    expect(score('a')).toBe(
      6 * POTATO_POINTS.win + POTATO_POINTS.loss + POTATO_POINTS.upsetLoss + toPotato,
    );
  });

  it('counts only the last games of each player', () => {
    const games = Array.from({ length: POTATO_GAMES + 5 }, (_, i) => game(i * 10, 8, 3));
    expect(points(games)('c')).toBe(POTATO_GAMES * POTATO_POINTS.loss);
  });
});
