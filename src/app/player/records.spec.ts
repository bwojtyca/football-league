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

describe('more achievements and the mishaps', () => {
  const goal = (at: number, player: string, extra: Partial<GameEvent> = {}): GameEvent =>
    ({
      at: at * 60_000,
      type: 'goal',
      team: player === 'a' || player === 'b' ? 'red' : 'blue',
      position: 'defence',
      player,
      ...extra,
    }) as GameEvent;
  // a loses 0:8, then beats the same team: three goals in a row (one with the goalkeeper),
  // all of the team's goals; a 10:8 marathon; a timed win on a golden goal after 3 minutes.
  const lost = game(0, 0, 8);
  const revenge = game(10, 3, 1, [
    goal(1, 'c'),
    goal(2, 'a'),
    goal(3, 'a', { rod: 'goalie' }),
    goal(4, 'a'),
  ]);
  revenge.mode = { target: 3 };
  revenge.teams.red.defence.ownGoals = 1;
  const marathon = game(20, 10, 8);
  marathon.mode = { target: 8, winBy: 2 };
  const golden = game(30, 1, 0, [goal(3.5, 'a')]);
  golden.mode = { target: 8, minutes: 3 };
  const games = [lost, revenge, marathon, golden];
  const changes = new Map([[revenge.id, new Map([['a', 20]])]]);
  const { achievements } = playerRecords('a', games, [], changes);

  it('counts each of them', () => {
    expect(achievements.firstWin).toEqual({ count: 1, date: revenge.start });
    expect(achievements.underTable.count).toBe(1);
    expect(achievements.revenge.count).toBe(1);
    expect(achievements.hatTrick.count).toBe(1);
    expect(achievements.goalieGoal.count).toBe(1);
    expect(achievements.solo.count).toBe(4 - 1);
    expect(achievements.giantKiller.count).toBe(1);
    expect(achievements.marathon.count).toBe(1);
    expect(achievements.goldenGoal.count).toBe(1);
    expect(achievements.streak3).toEqual({ count: 1, date: golden.start });
    expect(achievements.ownGoal.count).toBe(1);
    expect(achievements.lossStreak.count).toBe(0);
  });
});
