export interface Game {
  id: string;
  players: string[];
  start: string;
  end?: string;
  win?: string;
  teams: {
    [color: string]: {
      offence: {
        player: string;
        goals: number;
        ownGoals: number;
      };
      defence: {
        player: string;
        goals: number;
        ownGoals: number;
      };
    }
  };
}
