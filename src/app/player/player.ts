export interface Player {
  id: string;
  name: string;
  wins: number;
  loses: number;
}

export interface RankedPlayer extends Player {
  games: number;
  winRatio: number;
}

/** Adds games/win ratio and orders players by win ratio (best first), then by name. */
export function rankPlayers(players: Player[]): RankedPlayer[] {
  return players
    .map((player) => {
      const games = player.wins + player.loses;
      const winRatio = games ? Math.round((player.wins / games) * 10000) / 100 : 0;
      return { ...player, games, winRatio };
    })
    .sort((a, b) => b.winRatio - a.winRatio || compareNames(a, b));
}

export function compareNames(a: Player, b: Player): number {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}
