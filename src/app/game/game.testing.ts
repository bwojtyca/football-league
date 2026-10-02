import { Game } from './game';

/** A 2 vs 2 game (red: a+b, blue: c+d) with no goals yet. */
export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'g1',
    players: ['a', 'b', 'c', 'd'],
    start: '2017-11-03T10:00:00.000Z',
    teams: {
      red: {
        defence: { player: 'a', goals: 0, ownGoals: 0 },
        offence: { player: 'b', goals: 0, ownGoals: 0 },
      },
      blue: {
        defence: { player: 'c', goals: 0, ownGoals: 0 },
        offence: { player: 'd', goals: 0, ownGoals: 0 },
      },
    },
    ...overrides,
  };
}
