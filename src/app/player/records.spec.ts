import { Game, GameEvent } from '../game/game';
import { makeGame } from '../game/game.testing';
import { duets, playerRecords } from './records';

/** A finished game where a+b (red) play c+d (blue). */
function game(minute: number, red: number, blue: number, events?: GameEvent[]): Game {
  const at = (m: number) =>
    new Date(Date.parse('2026-10-02T10:00:00.000Z') + m * 60_000).toISOString();
  const g = makeGame({
    id: `g${minute}`,
    start: at(minute),
    end: at(minute + 5),
    win: red > blue ? 'red' : 'blue',
    events,
  });
  g.teams.red.defence.goals = red;
  g.teams.blue.defence.goals = blue;
  return g;
}

describe('playerRecords', () => {
  it('finds streaks, the biggest win and achievements', () => {
    const behind: GameEvent[] = [
      ...[1, 2, 3, 4].map((at) => ({
        at,
        type: 'goal' as const,
        team: 'blue' as const,
        position: 'defence' as const,
        player: 'c',
      })),
      ...[5, 6, 7, 8, 9, 10, 11, 12].map((at) => ({
        at,
        type: 'goal' as const,
        team: 'red' as const,
        position: 'defence' as const,
        player: 'a',
      })),
    ];
    const games = [
      game(0, 3, 8),
      game(10, 8, 0),
      game(20, 8, 6),
      game(30, 8, 4, behind),
      game(40, 8, 7),
      game(50, 8, 7),
    ];
    const records = playerRecords('a', games, [1510, 1530, 1520]);
    expect(records.longestWinStreak).toBe(5);
    expect(records.longestLossStreak).toBe(1);
    expect(records.biggestWin).toBe('8:0');
    expect(records.peakRating).toBe(1530);
    expect(records.achievements.shutout.count).toBe(1);
    expect(records.achievements.comeback.count).toBe(1);
    expect(records.achievements.streak).toEqual({ count: 1, date: games[5].start });
    expect(records.achievements.milestone.count).toBe(0);
    // c lost those games.
    expect(playerRecords('c', games).longestLossStreak).toBe(5);
  });
});

describe('duets', () => {
  it('ranks pairs with enough games by win rate', () => {
    const games = [game(0, 8, 1), game(10, 8, 2), game(20, 1, 8), game(30, 8, 3)];
    const list = duets(games, 3);
    expect(list.map((d) => [d.players.join('+'), d.games, d.wins])).toEqual([
      ['a+b', 4, 3],
      ['c+d', 4, 1],
    ]);
  });
});
