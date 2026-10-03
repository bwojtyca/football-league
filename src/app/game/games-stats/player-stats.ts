import { Game, opponent, teamOf, teamPlayers } from '../game';
import { gameSeconds } from '../../stats/stats';

export interface ResultStats {
  games: number;
  wins: number;
  loses: number;
}

export interface SideStats extends ResultStats {
  goals: number;
  own: number;
}

export interface RivalStats extends ResultStats {
  playerId: string;
  timePlayed: number;
}

export interface PlayerStats {
  goals: { total: number; own: number };
  /** Seconds played. */
  time: { total: number; wins: number; loses: number };
  games: { total: number; wins: number; loses: number };
  positions: { defender: SideStats; attacker: SideStats };
  colors: { red: SideStats; blue: SideStats };
  /** Team mates, best win ratio first. */
  allies: RivalStats[];
  /** Opponents, best win ratio (of `playerId` against them) first. */
  enemies: RivalStats[];
}

const sideStats = (): SideStats => ({ games: 0, wins: 0, loses: 0, goals: 0, own: 0 });

/** `a / b`, or 0 when there is nothing to divide by. */
export function ratio(a: number, b: number): number {
  return b ? a / b : 0;
}

/** Statistics of one player over their finished games. */
export function calculateStats(games: Game[], playerId: string): PlayerStats {
  const stats: PlayerStats = {
    goals: { total: 0, own: 0 },
    time: { total: 0, wins: 0, loses: 0 },
    games: { total: 0, wins: 0, loses: 0 },
    positions: { defender: sideStats(), attacker: sideStats() },
    colors: { red: sideStats(), blue: sideStats() },
    allies: [],
    enemies: [],
  };
  const allies = new Map<string, RivalStats>();
  const enemies = new Map<string, RivalStats>();
  const rival = (map: Map<string, RivalStats>, id: string): RivalStats => {
    let entry = map.get(id);
    if (!entry) {
      entry = { playerId: id, games: 0, wins: 0, loses: 0, timePlayed: 0 };
      map.set(id, entry);
    }
    return entry;
  };
  const addResult = (target: ResultStats, won: boolean) => {
    ++target.games;
    if (won) {
      ++target.wins;
    } else {
      ++target.loses;
    }
  };

  for (const game of games) {
    const color = teamOf(game, playerId);
    if (!game.end || !game.win || !color) {
      continue;
    }
    const team = game.teams[color];
    const won = color === game.win;
    const time = gameSeconds(game);

    ++stats.games.total;
    stats.time.total += time;
    if (won) {
      ++stats.games.wins;
      stats.time.wins += time;
    } else {
      ++stats.games.loses;
      stats.time.loses += time;
    }
    addResult(stats.colors[color], won);

    const positions = [
      { score: team.defence, side: stats.positions.defender },
      { score: team.offence, side: stats.positions.attacker },
    ];
    for (const { score, side } of positions) {
      if (score.player !== playerId) {
        continue;
      }
      stats.goals.total += score.goals;
      stats.goals.own += score.ownGoals;
      stats.colors[color].goals += score.goals;
      stats.colors[color].own += score.ownGoals;
      side.goals += score.goals;
      side.own += score.ownGoals;
      addResult(side, won);
    }

    for (const allyId of teamPlayers(team).filter((id) => id !== playerId)) {
      const ally = rival(allies, allyId);
      addResult(ally, won);
      ally.timePlayed += time;
    }
    for (const enemyId of teamPlayers(game.teams[opponent(color)])) {
      const enemy = rival(enemies, enemyId);
      addResult(enemy, won);
      enemy.timePlayed += time;
    }
  }

  const byWinRatio = (a: RivalStats, b: RivalStats) =>
    ratio(b.wins, b.games) - ratio(a.wins, a.games);
  stats.allies = [...allies.values()].sort(byWinRatio);
  stats.enemies = [...enemies.values()].sort(byWinRatio);
  return stats;
}
