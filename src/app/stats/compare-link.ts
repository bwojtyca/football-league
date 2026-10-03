import { ALL_LEAGUES } from '../league/league';

/** Address of the comparison of two players, in a league or over all leagues. */
export function compareLink(leagueId: string, a: string, b: string): string[] {
  return leagueId === ALL_LEAGUES ? ['/compare', a, b] : ['/l', leagueId, 'compare', a, b];
}
