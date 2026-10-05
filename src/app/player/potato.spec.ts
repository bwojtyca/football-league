import { Game } from '../game/game';
import { makeGame } from '../game/game.testing';
import { POTATO_POINTS, potatoRanking, potatoState } from './potato';

/** A game on day `day` of October 2026 (local time), `red` against `blue`. */
function game(
  day: number,
  minute: number,
  red: [string, string],
  blue: [string, string],
  [redGoals, blueGoals]: [number, number],
): Game {
  const start = new Date(2026, 9, day, 10, minute);
  const g = makeGame({
    id: `g${day}-${minute}`,
    players: [...red, ...blue],
    start: start.toISOString(),
    end: new Date(start.getTime() + 5 * 60_000).toISOString(),
    win: redGoals > blueGoals ? 'red' : 'blue',
  });
  g.teams = {
    red: {
      defence: { player: red[0], goals: redGoals, ownGoals: 0 },
      offence: { player: red[1], goals: 0, ownGoals: 0 },
    },
    blue: {
      defence: { player: blue[0], goals: blueGoals, ownGoals: 0 },
      offence: { player: blue[1], goals: 0, ownGoals: 0 },
    },
  };
  return g;
}

const day = (n: number) => new Date(2026, 9, n, 20);
/** Day 1: a+b beat c+d three times; c ends it as the potato. */
const dayOne = [0, 10, 20].map((m) => game(1, m, ['a', 'b'], ['c', 'd'], [8, 3]));

describe('potatoState', () => {
  it('shows the day in progress without deciding it', () => {
    const state = potatoState(dayOne, day(1));
    expect(state.holders).toEqual([]);
    expect(state.today.map((row) => [row.player, row.points])).toEqual([
      ['c', 3],
      ['d', 3],
      ['a', -3],
      ['b', -3],
    ]);
  });

  it('makes the weakest of a finished day the potato', () => {
    const state = potatoState(dayOne, day(2));
    expect(state.holders).toEqual([{ player: 'c', since: '2026-10-01' }]);
    expect(state.days.get('c')).toBe(1);
    expect(state.today).toEqual([]);
  });

  it('lets a potato who stays away keep it, so there can be two', () => {
    const dayTwo = [0, 10, 20].map((m) => game(2, m, ['a', 'b'], ['d', 'e'], [8, 4]));
    const state = potatoState([...dayOne, ...dayTwo], day(3));
    expect(state.holders.map((holder) => holder.player).sort()).toEqual(['c', 'd']);
  });

  it("counts a potato's wins for them and losing to a potato against the losers", () => {
    // Day 2: the potato c wins with d, then loses.
    const dayTwo = [
      game(2, 0, ['c', 'd'], ['a', 'b'], [8, 5]),
      game(2, 10, ['a', 'b'], ['c', 'd'], [8, 6]),
    ];
    const points = new Map(
      potatoState([...dayOne, ...dayTwo], day(2)).today.map((row) => [row.player, row.points]),
    );
    const { win, loss, potatoWin, lossToPotato } = POTATO_POINTS;
    expect(points.get('c')).toBe(win + potatoWin + loss);
    expect(points.get('d')).toBe(win + loss);
    expect(points.get('a')).toBe(loss + lossToPotato + win);
    // Not the weakest that day: c hands the title on.
    const after = potatoState([...dayOne, ...dayTwo], day(3));
    expect(after.holders.map((holder) => holder.player)).not.toContain('c');
  });
});

describe('potatoRanking', () => {
  it('lists the days as the potato, the potatoes now marked', () => {
    const rows = potatoRanking(dayOne, day(2));
    expect(rows[0]).toMatchObject({ player: 'c', days: 1, games: 3, isPotato: true });
    expect(rows.find((row) => row.player === 'a')).toMatchObject({ days: 0, isPotato: false });
  });
});
