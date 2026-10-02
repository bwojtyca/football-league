import { Game, Lineup, TeamColor } from '../game/game';
import { makeGame } from '../game/game.testing';
import { cupState } from './cup';
import { Tournament } from './tournament';

const T0 = Date.parse('2026-10-02T12:00:00.000Z');

function cup(teamCount: number, groups = 0): Tournament {
  return {
    id: 't',
    league: 'l',
    name: 'Cup',
    format: 'cup',
    created: '',
    mode: { target: 5 },
    teamSize: 1,
    entries: [],
    groups,
    teams: [...Array(teamCount).keys()].map((i) => ({ defence: `p${i}`, offence: `p${i}` })),
  };
}

let minute = 0;
/** A finished 1 vs 1 game between two teams of `tournament`, won by `winner`. */
function play(tournament: Tournament, red: number, blue: number, winner: number): Game {
  const team = (lineup: Lineup, goals: number) => ({
    defence: { player: lineup.defence, goals, ownGoals: 0 },
    offence: { player: lineup.offence, goals: 0, ownGoals: 0 },
  });
  const teams = tournament.teams!;
  const win: TeamColor = winner === red ? 'red' : 'blue';
  minute += 10;
  return makeGame({
    id: `g${minute}`,
    start: new Date(T0 + minute * 60_000).toISOString(),
    end: new Date(T0 + (minute + 5) * 60_000).toISOString(),
    win,
    teams: {
      red: team(teams[red], win === 'red' ? 5 : 2),
      blue: team(teams[blue], win === 'blue' ? 5 : 2),
    },
  });
}

describe('cupState', () => {
  it('gives byes to the best seeds and plays the rest down to a champion', async () => {
    const tournament = cup(3);
    let state = await cupState(tournament, []);
    expect(state.phase).toBe('knockout');
    expect(state.ready.length).toBe(1);
    const [semi] = state.ready;
    const games = [play(tournament, semi.red, semi.blue, semi.red)];
    state = await cupState(tournament, games);
    expect(state.ready.length).toBe(1);
    const [final] = state.ready;
    expect([final.red, final.blue]).toContain(semi.red);
    games.push(play(tournament, final.blue, final.red, final.blue));
    state = await cupState(tournament, games);
    expect(state.phase).toBe('done');
    expect(state.champion).toBe(final.blue);
    expect(state.ready.length).toBe(0);
  });

  it('plays two groups, then the best two of each in the semi-finals', async () => {
    const tournament = cup(6, 2);
    const games: Game[] = [];
    let state = await cupState(tournament, games);
    expect(state.phase).toBe('groups');
    expect(state.groups.map((group) => group.length)).toEqual([3, 3]);
    // The lower team index always wins.
    while (state.phase === 'groups') {
      const { red, blue } = state.ready[0];
      games.push(play(tournament, red, blue, Math.min(red, blue)));
      state = await cupState(tournament, games);
    }
    expect(games.length).toBe(6);
    expect(state.ready.length).toBe(2);
    const winners = state.groups.map((group) => group[0].team);
    const semiTeams = state.ready.flatMap((match) => [match.red, match.blue]);
    expect(semiTeams).toEqual(expect.arrayContaining(winners));
    // Group winners do not meet in the semi-finals.
    expect(state.ready.some((m) => winners.includes(m.red) && winners.includes(m.blue))).toBe(
      false,
    );
    expect(state.bracket?.matches.length).toBe(3);
  });

  it('marks the match being played', async () => {
    const tournament = cup(4);
    const state = await cupState(tournament, []);
    const { red, blue } = state.ready[0];
    const running = { ...play(tournament, red, blue, red), end: undefined, win: undefined };
    const next = await cupState(tournament, [running]);
    expect(next.ready.find((m) => m.game)?.game?.id).toBe(running.id);
  });
});
