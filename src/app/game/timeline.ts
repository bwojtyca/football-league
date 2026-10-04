import { Game, GameEvent, opponent, Position, Rod, TeamColor } from './game';

/** A goal of the log with the score right after it; `team` is the team credited. */
export interface TimelineGoal {
  at: number;
  team: TeamColor;
  /** Who scored, and from where; an own goal is scored by the other team's player. */
  player: string;
  position: Position;
  /** The rod and the figure, when the goal was told in that detail. */
  rod?: Rod;
  man?: number;
  own: boolean;
  score: Record<TeamColor, number>;
}

export interface Timeline {
  goals: TimelineGoal[];
  /** Most goals in a row by one team. */
  longestRun?: { team: TeamColor; goals: number };
  /** Biggest lead of each team, with the score at that moment. */
  biggestLead: Partial<Record<TeamColor, { lead: number; score: Record<TeamColor, number> }>>;
  /** The winner came back from this far behind (two goals or more). */
  comeback?: { team: TeamColor; score: Record<TeamColor, number> };
}

/** The story of a game from its event log; `undefined` for games without one. */
export function timelineOf(game: Pick<Game, 'events' | 'win'>): Timeline | undefined {
  if (!game.events) {
    return undefined;
  }
  const score = { red: 0, blue: 0 };
  const goals: TimelineGoal[] = [];
  for (const event of game.events) {
    if (event.type === 'swap') {
      continue;
    }
    const team = creditedTeam(event);
    score[team]++;
    goals.push({
      at: event.at,
      team,
      player: event.player,
      position: event.position,
      ...(event.rod && { rod: event.rod, man: event.man }),
      own: event.type === 'own',
      score: { ...score },
    });
  }

  let longestRun: Timeline['longestRun'];
  let run = 0;
  goals.forEach((goal, i) => {
    run = i > 0 && goals[i - 1].team === goal.team ? run + 1 : 1;
    if (!longestRun || run > longestRun.goals) {
      longestRun = { team: goal.team, goals: run };
    }
  });

  const biggestLead: Timeline['biggestLead'] = {};
  for (const goal of goals) {
    const lead = goal.score[goal.team] - goal.score[opponent(goal.team)];
    if (lead > 0 && lead > (biggestLead[goal.team]?.lead ?? 0)) {
      biggestLead[goal.team] = { lead, score: goal.score };
    }
  }

  const loser = game.win && opponent(game.win);
  const deficit = loser && biggestLead[loser];
  const comeback =
    game.win && deficit && deficit.lead >= 2 ? { team: game.win, score: deficit.score } : undefined;

  return {
    goals,
    longestRun: longestRun && longestRun.goals > 1 ? longestRun : undefined,
    biggestLead,
    comeback,
  };
}

function creditedTeam(event: Exclude<GameEvent, { type: 'swap' }>): TeamColor {
  return event.type === 'own' ? opponent(event.team) : event.team;
}
