import { Game, TEAM_COLORS, teamPlayers } from '../game/game';

/**
 * Documents created before 2026 also hold `wins`/`loses` counters; they drifted from
 * the games over time and are no longer used, results are counted from the games.
 */
export interface Player {
  id: string;
  name: string;
}

export interface RankedPlayer extends Player {
  wins: number;
  loses: number;
  games: number;
  winRatio: number;
}

/** Wins and losses of every player, counted from finished games. */
export function countResults(games: Game[]): Map<string, { wins: number; loses: number }> {
  const results = new Map<string, { wins: number; loses: number }>();
  for (const game of games) {
    if (!game.end || !game.win) {
      continue;
    }
    for (const color of TEAM_COLORS) {
      for (const playerId of teamPlayers(game.teams[color])) {
        let result = results.get(playerId);
        if (!result) {
          result = { wins: 0, loses: 0 };
          results.set(playerId, result);
        }
        if (color === game.win) {
          ++result.wins;
        } else {
          ++result.loses;
        }
      }
    }
  }
  return results;
}

/** Players with their results, best win ratio first, then by name. */
export function rankPlayers(players: Player[], games: Game[]): RankedPlayer[] {
  const results = countResults(games);
  return players
    .map((player) => {
      const { wins, loses } = results.get(player.id) ?? { wins: 0, loses: 0 };
      const total = wins + loses;
      const winRatio = total ? Math.round((wins / total) * 10000) / 100 : 0;
      return { id: player.id, name: player.name, wins, loses, games: total, winRatio };
    })
    .sort((a, b) => b.winRatio - a.winRatio || compareNames(a, b));
}

export function compareNames(a: Player, b: Player): number {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}
