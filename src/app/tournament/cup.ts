import { BracketsManager } from 'brackets-manager';
import { InMemoryDatabase } from 'brackets-memory-db';
import { Id, Match, MatchGame, Participant, Stage, Status } from 'brackets-model';

import { Game, sideOf, TeamColor, teamScore } from '../game/game';
import { compareTeams, TeamStanding, Tournament, withPlaces } from './tournament';

/** A cup game whose teams are known: by team index, `red` being the first opponent. */
export interface CupMatch {
  matchId: number;
  red: number;
  blue: number;
  /** The game being played for it, if any. */
  game?: Game;
}

export interface CupState {
  phase: 'groups' | 'knockout' | 'done';
  /** Group tables (group stage only), best first. */
  groups: TeamStanding[][];
  /** The knockout stage as brackets-viewer draws it; participant names are team indexes. */
  bracket?: {
    stages: Stage[];
    matches: Match[];
    matchGames: MatchGame[];
    participants: Participant[];
  };
  /** Games that can be played now. */
  ready: CupMatch[];
  /** Team index of the cup winner. */
  champion?: number;
}

/** How many teams of each group go through to the knockout stage. */
export const QUALIFIED_PER_GROUP = 2;

function nextPowerOfTwo(count: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(2, count)));
}

/**
 * Plays a cup (optionally with a group stage first) from its games with brackets-manager:
 * the bracket is built from scratch in memory and every finished game, oldest first, is
 * recorded in the match of its two teams.
 */
export async function cupState(tournament: Tournament, games: Game[]): Promise<CupState> {
  const teams = tournament.teams ?? [];
  const sides = teams.map(sideOf);
  const manager = new BracketsManager(new InMemoryDatabase());
  const names = teams.map((_, index) => String(index));
  const groupCount = tournament.groups ?? 0;

  if (groupCount) {
    await manager.create.stage({
      tournamentId: 0,
      name: 'groups',
      type: 'round_robin',
      seeding: names,
      settings: { groupCount, seedOrdering: ['groups.seed_optimized'] },
    });
  } else {
    await manager.create.stage({
      tournamentId: 0,
      name: 'cup',
      type: 'single_elimination',
      seeding: [...names, ...Array(nextPowerOfTwo(names.length) - names.length).fill(null)],
      settings: { seedOrdering: ['inner_outer'], balanceByes: true },
    });
  }

  const data = () => manager.get.tournamentData(0);
  const teamOf = async (participantId: Id | null | undefined) => {
    const participant = (await data()).participant.find((p) => p.id === participantId);
    return participant ? Number(participant.name) : -1;
  };
  const currentStage = async () => (await data()).stage.at(-1)!;
  const openMatches = async () => {
    const { match } = await data();
    const stage = await currentStage();
    return match.filter(
      (m) => m.stage_id === stage.id && (m.status === Status.Ready || m.status === Status.Running),
    );
  };

  /** The open match of the two teams of `game`, with the colour of its first opponent. */
  const matchOf = async (game: Game) => {
    const red = sides.indexOf(sideOf(game.teams.red));
    const blue = sides.indexOf(sideOf(game.teams.blue));
    for (const match of await openMatches()) {
      const first = await teamOf(match.opponent1?.id);
      const second = await teamOf(match.opponent2?.id);
      if (first === red && second === blue) {
        return { match, firstColor: 'red' as TeamColor };
      }
      if (first === blue && second === red) {
        return { match, firstColor: 'blue' as TeamColor };
      }
    }
    return undefined;
  };

  const startKnockout = async () => {
    const { match, group } = await data();
    const groupStage = (await data()).stage[0];
    const tables = await groupTables(
      group.map((g) => g.id),
      match,
      groupStage.id,
      teamOf,
    );
    // Winners meet runners-up of the other group: A1-B2 and B1-A2.
    const seeding = [...Array(QUALIFIED_PER_GROUP).keys()]
      .flatMap((place) => tables.map((table) => table[place]?.team))
      .filter((team) => team !== undefined);
    const ids = (await data()).participant;
    const idOf = (team: number) => ids.find((p) => p.name === String(team))!.id;
    const order = seeding.length === 4 ? [seeding[0], seeding[3], seeding[1], seeding[2]] : seeding;
    await manager.create.stage({
      tournamentId: 0,
      name: 'cup',
      type: 'single_elimination',
      seedingIds: [
        ...order.map(idOf),
        ...Array(nextPowerOfTwo(order.length) - order.length).fill(null),
      ],
      settings: { seedOrdering: ['natural'], balanceByes: true },
    });
  };

  const groupsDone = async () => {
    const { match, stage } = await data();
    return match
      .filter((m) => m.stage_id === stage[0].id)
      .every((m) => m.status >= Status.Completed);
  };

  const finished = games
    .filter((game) => game.win)
    .sort((a, b) => ((a.end ?? '') < (b.end ?? '') ? -1 : 1));
  for (const game of finished) {
    const found = await matchOf(game);
    if (!found) {
      continue;
    }
    const second: TeamColor = found.firstColor === 'red' ? 'blue' : 'red';
    await manager.update.match({
      id: found.match.id,
      opponent1: {
        score: teamScore(game, found.firstColor),
        result: game.win === found.firstColor ? 'win' : 'loss',
      },
      opponent2: {
        score: teamScore(game, second),
        result: game.win === second ? 'win' : 'loss',
      },
    });
    if (groupCount && (await data()).stage.length === 1 && (await groupsDone())) {
      await startKnockout();
    }
  }

  const running = games.find((game) => !game.end);
  const runningMatch = running && (await matchOf(running));
  if (running && runningMatch) {
    const second: TeamColor = runningMatch.firstColor === 'red' ? 'blue' : 'red';
    await manager.update.match({
      id: runningMatch.match.id,
      opponent1: { score: teamScore(running, runningMatch.firstColor) },
      opponent2: { score: teamScore(running, second) },
    });
  }

  const ready: CupMatch[] = [];
  for (const match of await openMatches()) {
    ready.push({
      matchId: Number(match.id),
      red: await teamOf(match.opponent1?.id),
      blue: await teamOf(match.opponent2?.id),
      game: runningMatch?.match.id === match.id ? running : undefined,
    });
  }

  const all = await data();
  const knockout = all.stage.find((stage) => stage.type === 'single_elimination');
  const groups =
    groupCount && all.stage[0]
      ? await groupTables(
          all.group.filter((g) => g.stage_id === all.stage[0].id).map((g) => g.id),
          all.match,
          all.stage[0].id,
          teamOf,
        )
      : [];
  let champion: number | undefined;
  if (knockout) {
    const matches = all.match.filter((m) => m.stage_id === knockout.id);
    const final = matches.at(-1);
    if (final && final.status >= Status.Completed) {
      const winner = final.opponent1?.result === 'win' ? final.opponent1 : final.opponent2;
      champion = await teamOf(winner?.id);
    }
  }
  return {
    phase: champion !== undefined ? 'done' : knockout ? 'knockout' : 'groups',
    groups,
    bracket: knockout && {
      stages: [knockout],
      matches: all.match.filter((m) => m.stage_id === knockout.id),
      matchGames: [],
      participants: all.participant,
    },
    ready,
    champion,
  };
}

/** Group tables from the group matches, in the order of `compareTeams`. */
async function groupTables(
  groupIds: Id[],
  matches: Match[],
  stageId: Id,
  teamOf: (participantId: Id | null | undefined) => Promise<number>,
): Promise<TeamStanding[][]> {
  const tables: TeamStanding[][] = [];
  for (const groupId of groupIds) {
    const rows = new Map<number, TeamStanding>();
    const row = (team: number) => {
      if (!rows.has(team)) {
        rows.set(team, { team, place: 0, games: 0, wins: 0, goalsFor: 0, goalsAgainst: 0 });
      }
      return rows.get(team)!;
    };
    for (const match of matches.filter((m) => m.stage_id === stageId && m.group_id === groupId)) {
      const first = row(await teamOf(match.opponent1?.id));
      const second = row(await teamOf(match.opponent2?.id));
      if (match.status < Status.Completed) {
        continue;
      }
      for (const [team, own, other] of [
        [first, match.opponent1, match.opponent2],
        [second, match.opponent2, match.opponent1],
      ] as const) {
        team.games++;
        team.wins += Number(own?.result === 'win');
        team.goalsFor += own?.score ?? 0;
        team.goalsAgainst += other?.score ?? 0;
      }
    }
    tables.push(withPlaces([...rows.values()].sort(compareTeams), compareTeams));
  }
  return tables;
}
