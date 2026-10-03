import { makeGame } from '../game/game.testing';
import { Tournament } from './tournament';
import { tournamentWinners } from './winners';

/** a+b (red) against c+d (blue), won by `win`. */
function game(id: string, day: number, win: 'red' | 'blue') {
  const start = `2026-10-0${day}T10:00:00.000Z`;
  const played = makeGame({ id, start, end: `2026-10-0${day}T10:05:00.000Z`, win });
  played.teams[win].defence.goals = 8;
  return played;
}

const tournament: Tournament = {
  id: 't',
  league: 'l',
  name: 'T',
  format: 'open',
  created: '2026-10-01T09:00:00.000Z',
  mode: { target: 8 },
  teamSize: 2,
  entries: [],
};

describe('tournamentWinners', () => {
  const games = [game('g1', 1, 'red'), game('g2', 2, 'red'), game('g3', 3, 'blue')];

  it('shares the first place of an individual table', async () => {
    expect(await tournamentWinners(tournament, games)).toEqual([['a'], ['b']]);
  });

  it('names the team that took a series', async () => {
    const series: Tournament = {
      ...tournament,
      format: 'series',
      bestOf: 3,
      teams: [
        { defence: 'c', offence: 'd' },
        { defence: 'a', offence: 'b' },
      ],
    };
    expect(await tournamentWinners(series, games.slice(0, 2))).toEqual([['a', 'b']]);
    expect(await tournamentWinners(series, games.slice(0, 1))).toEqual([]);
  });
});
