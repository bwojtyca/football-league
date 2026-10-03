import { Game, lineupPlayers } from '../game/game';
import {
  kingState,
  playerStandings,
  presentPlayers,
  roundRobinFixtures,
  seriesState,
  teamStandings,
  Tournament,
} from './tournament';

/**
 * The players of each winner of a tournament, as its page shows them once it has ended:
 * several on a shared first place, none before anyone won a game. A cup is worked out with
 * brackets-manager, loaded only then.
 */
export async function tournamentWinners(
  tournament: Tournament,
  games: Game[],
): Promise<string[][]> {
  const teams = tournament.teams ?? [];
  switch (tournament.format) {
    case 'king': {
      const record = kingState(tournament, games).record;
      return record ? [lineupPlayers(record.lineup)] : [];
    }
    case 'dyp':
    case 'open':
    case 'rotation': {
      const players = new Set([
        ...presentPlayers(tournament.entries).keys(),
        ...games.flatMap((game) => game.players),
      ]);
      return playerStandings([...players], games)
        .filter((row) => row.place === 1 && row.games)
        .map((row) => [row.player]);
    }
    case 'series': {
      const winner = seriesState(tournament, games).winner;
      return winner === undefined ? [] : [lineupPlayers(teams[winner])];
    }
    case 'roundRobin':
      return teamStandings(tournament, roundRobinFixtures(tournament, games))
        .filter((row) => row.place === 1 && row.games)
        .map((row) => lineupPlayers(teams[row.team]));
    case 'cup': {
      const { cupState } = await import('./cup');
      const champion = (await cupState(tournament, games)).champion;
      return champion === undefined ? [] : [lineupPlayers(teams[champion])];
    }
  }
}
