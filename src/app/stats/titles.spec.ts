import { Game } from '../game/game';
import { makeGame } from '../game/game.testing';
import { computeRatings } from '../player/rating';
import { leagueTitles, titlesByPlayer } from './titles';

/** a+b (red) against c+d (blue); a and c score their team's goals. */
function played(day: number, [red, blue]: [number, number]): Game {
  const start = new Date(Date.UTC(2026, 9, day, 10));
  const game = makeGame({
    id: `t${day}`,
    start: start.toISOString(),
    end: new Date(start.getTime() + (5 + day) * 60_000).toISOString(),
    win: red > blue ? 'red' : 'blue',
  });
  game.teams.red.defence.goals = red;
  game.teams.blue.defence.goals = blue;
  return game;
}

describe('leagueTitles', () => {
  // a+b win five games, then lose one; three wins in a row again at the end.
  const games = [
    ...[1, 2, 3, 4, 5].map((day) => played(day, [8, day])),
    played(6, [2, 8]),
    ...[7, 8, 9].map((day) => played(day, [8, 4])),
  ];
  const titles = leagueTitles(games, computeRatings(games));
  const holder = (id: string) => titles.find((title) => title.id === id)?.players;

  it('names the holders, ties sharing a title', () => {
    expect(holder('leader')).toEqual(['a', 'b']);
    expect(holder('sniper')).toEqual(['a']);
    expect(holder('wall')).toEqual(['a']);
    expect(holder('onFire')).toEqual(['a', 'b']);
    // Everyone played every game: a title nobody stands out for is not given.
    expect(holder('veteran')).toBeUndefined();
    expect(holder('duo')).toEqual(['a', 'b']);
    expect(holder('goalieScorer')).toBeUndefined();
    expect(
      titlesByPlayer(titles)
        .get('a')
        ?.map((title) => title.id),
    ).toContain('sniper');
  });
});
