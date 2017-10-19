export interface Game {
  players: number[];
  start: string;
  end?: string;
  teams: Array<{
    color: string;
    offence: {
      player: number;
      goals: number;
      ownGoals: number;
    };
    defence: {
      player: number;
      goals: number;
      ownGoals: number;
    };
  }>;
}
