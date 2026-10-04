import { Game, opponent, TEAM_COLORS, teamPlayers, teamScore } from '../game/game';
import { timelineOf } from '../game/timeline';
import { results } from '../player/player';
import { potatoRanking } from '../player/potato';
import { Ratings } from '../player/rating';
import { duets } from '../player/records';
import { finished, gameSeconds } from './stats';

/**
 * Titles of a league, held now by the best (or worst) at something; ties share a title. The
 * order is the order they are shown in.
 */
export const TITLES = {
  leader: '👑',
  potato: '🥔',
  sniper: '🎯',
  wall: '🧱',
  onFire: '🔥',
  veteran: '🎖️',
  marathoner: '⏱️',
  comebackKing: '💪',
  duo: '🤝',
  goalieScorer: '🧤',
} as const;
export type TitleId = keyof typeof TITLES;

/** Fewest games for the per-game titles (goals and goals conceded). */
export const TITLE_GAMES = 5;
/** Fewest wins in a row to be on fire. */
export const ON_FIRE_WINS = 3;

export interface Title {
  id: TitleId;
  icon: string;
  players: string[];
  /** What earned it: a rating, goals per game, wins in a row, seconds played... */
  value: number;
}

/** The current holders of each title; a title nobody qualifies for is left out. */
export function leagueTitles(games: Game[], ratings: Ratings, minGames = 0): Title[] {
  const played = finished(games);
  const counts = results(played);
  const enough = (player: string, needed: number) => (counts.get(player)?.length ?? 0) >= needed;
  const titles: Title[] = [];
  /** The title goes to the best value, unless everyone measured shares it. */
  const add = (id: TitleId, values: Map<string, number>, lowest = false, floor = 0) => {
    const list = [...values].filter(([, v]) => lowest || v > floor);
    if (!list.length) {
      return;
    }
    const value = (lowest ? Math.min : Math.max)(...list.map(([, v]) => v));
    const players = list.filter(([, v]) => v === value).map(([player]) => player);
    if (players.length > 1 && players.length === values.size) {
      return;
    }
    titles.push({ id, icon: TITLES[id], players, value });
  };

  const ranked = Math.max(1, minGames);
  add(
    'leader',
    new Map([...ratings.current].filter(([player]) => enough(player, ranked))),
    false,
    -Infinity,
  );

  const potatoes = potatoRanking(played).filter((row) => row.isPotato);
  if (potatoes.length) {
    titles.push({
      id: 'potato',
      icon: TITLES.potato,
      players: potatoes.map((row) => row.player),
      value: potatoes[0].points,
    });
  }

  const goals = new Map<string, number>();
  const conceded = new Map<string, { games: number; goals: number }>();
  const seconds = new Map<string, number>();
  const comebacks = new Map<string, number>();
  const goalieGoals = new Map<string, number>();
  const add1 = (map: Map<string, number>, player: string, n: number) =>
    map.set(player, (map.get(player) ?? 0) + n);
  for (const game of played) {
    const comeback = timelineOf(game)?.comeback;
    for (const color of TEAM_COLORS) {
      const team = game.teams[color];
      add1(goals, team.defence.player, team.defence.goals);
      add1(goals, team.offence.player, team.offence.goals);
      if (teamPlayers(team).length === 2) {
        const wall = conceded.get(team.defence.player) ?? { games: 0, goals: 0 };
        wall.games++;
        wall.goals += teamScore(game, opponent(color));
        conceded.set(team.defence.player, wall);
      }
      for (const player of teamPlayers(team)) {
        add1(seconds, player, gameSeconds(game));
        if (comeback?.team === color) {
          add1(comebacks, player, 1);
        }
      }
    }
    for (const event of game.events ?? []) {
      if (event.type === 'goal' && event.rod === 'goalie') {
        add1(goalieGoals, event.player, 1);
      }
    }
  }
  const perGame = TITLE_GAMES;
  add(
    'sniper',
    new Map(
      [...goals]
        .filter(([player]) => enough(player, perGame))
        .map(([player, n]) => [player, n / counts.get(player)!.length]),
    ),
  );
  add(
    'wall',
    new Map(
      [...conceded]
        .filter(([, wall]) => wall.games >= perGame)
        .map(([player, wall]) => [player, wall.goals / wall.games]),
    ),
    true,
  );

  /** Wins in a row up to now. */
  const current = new Map(
    [...counts].map(([player, list]) => {
      const last = list.lastIndexOf('L');
      return [player, list.length - 1 - last];
    }),
  );
  add('onFire', current, false, ON_FIRE_WINS - 1);
  add('veteran', new Map([...counts].map(([player, list]) => [player, list.length])));
  add('marathoner', seconds);
  add('comebackKing', comebacks);

  const duo = duets(played, perGame)[0];
  if (duo && duo.games >= perGame) {
    titles.push({ id: 'duo', icon: TITLES.duo, players: duo.players, value: duo.winRatio });
  }
  add('goalieScorer', goalieGoals);
  return titles;
}

/** The titles each player holds now. */
export function titlesByPlayer(titles: Title[]): Map<string, Title[]> {
  const byPlayer = new Map<string, Title[]>();
  for (const title of titles) {
    for (const player of title.players) {
      byPlayer.set(player, [...(byPlayer.get(player) ?? []), title]);
    }
  }
  return byPlayer;
}
