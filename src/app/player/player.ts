export interface Player {
  id: string;
  name: string;
  wins: number;
  loses: number;
  games?: number;
  winRatio?: number;
}
