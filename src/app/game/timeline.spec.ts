import { GameEvent } from './game';
import { timelineOf } from './timeline';

const goal = (at: number, team: 'red' | 'blue', own = false): GameEvent => ({
  at,
  type: own ? 'own' : 'goal',
  team,
  position: 'offence',
  player: team === 'red' ? 'a' : 'c',
});

describe('timelineOf', () => {
  it('has nothing to tell for games without a log', () => {
    expect(timelineOf({})).toBeUndefined();
  });

  it('follows the score, runs, leads and comebacks', () => {
    // Blue leads 0:3, red comes back with five in a row (one an own goal by blue).
    const events: GameEvent[] = [
      goal(1, 'blue'),
      goal(2, 'blue'),
      goal(3, 'blue'),
      { at: 4, type: 'swap', team: 'red' },
      goal(5, 'red'),
      goal(6, 'blue', true),
      goal(7, 'red'),
      goal(8, 'red'),
      goal(9, 'red'),
    ];
    const timeline = timelineOf({ events, win: 'red' })!;
    expect(timeline.goals.map((g) => `${g.score.red}:${g.score.blue}`)).toEqual([
      '0:1',
      '0:2',
      '0:3',
      '1:3',
      '2:3',
      '3:3',
      '4:3',
      '5:3',
    ]);
    expect(timeline.goals[4]).toMatchObject({ team: 'red', own: true, player: 'c' });
    expect(timeline.longestRun).toEqual({ team: 'red', goals: 5 });
    expect(timeline.biggestLead.blue?.lead).toBe(3);
    expect(timeline.comeback).toEqual({ team: 'red', score: { red: 0, blue: 3 } });
  });
});
