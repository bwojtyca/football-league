import { Game, lineupPlayers, opponent, TEAM_COLORS, teamScore } from '../game/game';
import { K_FACTOR, START_RATING, winChance } from './rating';

/**
 * Points of the "potato" ranking (the one nobody wants to top). A first version, to be
 * tuned with the players: every number is here.
 */
export const POTATO_POINTS = {
  /** Every lost game. */
  loss: 1,
  /** Every won game takes a point off (never below zero). */
  win: -1,
  /** Lost without scoring a goal. */
  shutoutLoss: 2,
  /** Lost as clear favourites (a win chance of at least `FAVOURITE`). */
  upsetLoss: 1,
  /** Lost to a team with the current potato in it. */
  lossToPotato: 3,
  /** Beat a team with the current king (best Elo) in it: some hate for the strongest. */
  beatKing: -2,
};

/** A win chance from this up makes a team the clear favourite. */
export const FAVOURITE = 0.65;
/** Fewest games to hold the potato (or king) title. */
export const POTATO_MIN_GAMES = 3;

export interface PotatoRow {
  player: string;
  points: number;
  games: number;
  /** Games played while holding the potato title. */
  gamesAsPotato: number;
  isPotato: boolean;
}

/** The potato ranking of a set of games: most points first. */
export function potatoRanking(games: Game[]): PotatoRow[] {
  const points = new Map<string, number>();
  const played = new Map<string, number>();
  const asPotato = new Map<string, number>();
  const ratings = new Map<string, number>();
  const rating = (id: string) => ratings.get(id) ?? START_RATING;
  const eligible = (id: string) => (played.get(id) ?? 0) >= POTATO_MIN_GAMES;
  const potato = () =>
    [...points.entries()]
      .filter(([id]) => eligible(id))
      .sort((a, b) => b[1] - a[1] || (played.get(b[0]) ?? 0) - (played.get(a[0]) ?? 0))[0]?.[0];
  const king = () =>
    [...ratings.entries()].filter(([id]) => eligible(id)).sort((a, b) => b[1] - a[1])[0]?.[0];

  const finished = games.filter((game) => game.win).sort((a, b) => (a.start < b.start ? -1 : 1));
  for (const game of finished) {
    const currentPotato = potato();
    const currentKing = king();
    const teams = {
      red: lineupPlayers(game.teams.red),
      blue: lineupPlayers(game.teams.blue),
    };
    const strength = (color: 'red' | 'blue') =>
      teams[color].reduce((sum, id) => sum + rating(id), 0) / teams[color].length;
    const before = { red: strength('red'), blue: strength('blue') };

    for (const color of TEAM_COLORS) {
      const other = opponent(color);
      const won = game.win === color;
      const chance = winChance(before[color], before[other]);
      let change = won ? POTATO_POINTS.win : POTATO_POINTS.loss;
      if (!won && teamScore(game, color) === 0) {
        change += POTATO_POINTS.shutoutLoss;
      }
      if (!won && chance >= FAVOURITE) {
        change += POTATO_POINTS.upsetLoss;
      }
      if (!won && currentPotato && teams[other].includes(currentPotato)) {
        change += POTATO_POINTS.lossToPotato;
      }
      if (won && currentKing && teams[other].includes(currentKing)) {
        change += POTATO_POINTS.beatKing;
      }
      const delta = K_FACTOR * ((won ? 1 : 0) - chance);
      for (const id of teams[color]) {
        points.set(id, Math.max(0, (points.get(id) ?? 0) + change));
        played.set(id, (played.get(id) ?? 0) + 1);
        ratings.set(id, rating(id) + delta);
        if (id === currentPotato) {
          asPotato.set(id, (asPotato.get(id) ?? 0) + 1);
        }
      }
    }
  }
  const current = potato();
  return [...played.keys()]
    .map((player) => ({
      player,
      points: points.get(player) ?? 0,
      games: played.get(player) ?? 0,
      gamesAsPotato: asPotato.get(player) ?? 0,
      isPotato: player === current,
    }))
    .sort((a, b) => b.points - a.points || b.games - a.games);
}
