import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { t, tag } from './helpers';
import { create, OWNER, Value } from './rest';

/**
 * A tour of every screen, sheet and dialog with lifelike data, at five screen sizes, for design
 * reviews (owner, 12 Oct 2026): screenshots in `screenshots/tour/<size>/`. A second league with
 * awkward data (long and short names, many players and games, long games, one on one, timed,
 * paused) is shot at three sizes as `awkward-*` (owner, 13 Oct). Every shot has an audit next to
 * it (`.json`): the left edges of the blocks on the page (to spot misalignment), the texts cut
 * by an ellipsis and the tap targets under 40 px. It runs only in the Tour workflow
 * (`TOUR=1`), not in every Check: `gh workflow run tour.yml --ref <branch>`.
 */
test.skip(!process.env['TOUR'], 'Only in the Tour workflow');

const SIZES = [
  { name: '1-phone-small', viewport: { width: 360, height: 640 }, scale: 2, mobile: true },
  { name: '2-phone', viewport: { width: 412, height: 915 }, scale: 2, mobile: true },
  { name: '3-tablet', viewport: { width: 820, height: 1180 }, scale: 1, mobile: true },
  { name: '4-desktop', viewport: { width: 1280, height: 800 }, scale: 1, mobile: false },
  { name: '5-wide', viewport: { width: 1920, height: 1080 }, scale: 1, mobile: false },
];

const NAMES = ['Ala', 'Bartek', 'Celina', 'Darek', 'Ewa', 'Filip', 'Gosia'];
/** Some players have chosen a kit, the others still have their initials. */
const KITS: (Record<string, Value> | null)[] = [
  { pattern: 'halves', c1: 'yellow', c2: 'blue', num: 9 },
  { pattern: 'stripes', c1: 'white', c2: 'black', num: 10 },
  null,
  { pattern: 'hoops', c1: 'green', c2: 'white', num: 4 },
  { pattern: 'sash', c1: 'white', c2: 'red', num: 3 },
  null,
  null,
];
const MODE = { target: 8, winBy: 2 };
const DAY = 24 * 3600_000;

interface Seed {
  league: string;
  empty: string;
  players: string[];
  finished: string;
  running: string;
  tournament: string;
}

let seeded: Promise<Seed> | undefined;

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({
      viewport: size.viewport,
      deviceScaleFactor: size.scale,
      isMobile: size.mobile,
      hasTouch: size.mobile,
    });

    test('every screen', async ({ page, request }) => {
      test.setTimeout(300_000);
      const data = await (seeded ??= seed(request));
      const shot = shooter(page, size.name);
      const league = `/#/l/${data.league}`;
      const [a, b] = data.players;

      // The league: ranking (players, pairs, potato), games, statistics, tournaments.
      await page.goto(league);
      await expect(page.locator('fl-ranking .row').first()).toBeVisible();
      await shot('01-league-ranking');
      // Pairs and the potato need enough games; their switches are off until then.
      for (const [view, name] of [
        ['league.duets', '02-league-duets'],
        ['potato.title', '03-league-potato'],
      ]) {
        const radio = page.getByRole('radio', { name: t(view) });
        if (await radio.isEnabled()) {
          await radio.click();
          await shot(name);
        }
      }
      await page.getByRole('radio', { name: 'Elo' }).click();

      await page.goto(`${league}/games`);
      await expect(page.locator('fl-game-list .day').first()).toBeVisible();
      await shot('04-games');
      await page.goto(`${league}/stats`);
      await expect(page.locator('fl-league-stats canvas').first()).toBeVisible();
      await shot('05-league-stats');
      await page.goto(`${league}/tournaments`);
      await expect(page.getByText('Turniej piątkowy')).toBeVisible();
      await shot('06-tournaments');
      await page.goto(`${league}/t/${data.tournament}`);
      await expect(page.locator('fl-tournament-page')).toContainText('Turniej piątkowy');
      await shot('07-tournament');
      await page.goto(`${league}/players`);
      await expect(page.locator('fl-league-players fl-avatar').first()).toBeVisible();
      await shot('08-players');
      await page.goto(`${league}/settings`);
      await expect(page.locator('fl-league-settings')).toBeVisible();
      await shot('10-settings');

      // A player: the profile's three parts, the kit editor, a comparison.
      await page.goto(`${league}/player/${a}`);
      await expect(page.locator('section.hero')).toBeVisible();
      await shot('11-profile');
      await page.getByRole('tab', { name: t('player.tabs.stats') }).click();
      await shot('12-profile-stats');
      await page.getByRole('tab', { name: t('player.tabs.games') }).click();
      await shot('13-profile-games');
      await page.getByRole('tab', { name: t('player.tabs.overview') }).click();
      await page
        .locator('section.hero')
        .getByRole('button', { name: t('kit.title') })
        .click();
      await expect(page.locator('fl-kit-dialog')).toBeVisible();
      await shot('14-kit-editor', false);
      await page.keyboard.press('Escape');
      await expect(page.locator('fl-kit-dialog')).toBeHidden();
      await page.goto(`${league}/compare/${a}/${b}`);
      await expect(page.locator('fl-compare-page')).toContainText(NAMES[1]);
      await shot('15-compare');

      // A finished game, everything overall, an empty league, the leagues.
      await page.goto(`/#/game/${data.finished}`);
      await expect(page.locator('fl-game-timeline')).toBeVisible();
      await shot('16-game-finished');
      await page.goto('/#/ranking');
      await expect(page.locator('fl-ranking .row').first()).toBeVisible();
      await shot('17-overall-ranking');
      await page.goto(`/#/player/${a}`);
      await expect(page.locator('section.hero')).toBeVisible();
      await shot('18-overall-profile');
      await page.goto(`/#/l/${data.empty}`);
      await expect(page.locator('section.first')).toBeVisible();
      await shot('19-empty-league');
      await page.goto('/#/leagues');
      await expect(page.locator('fl-leagues').getByText('Biuro 2026').first()).toBeVisible();
      await shot('20-leagues');
      await page.getByRole('button', { name: t('leagues.new') }).click();
      await expect(page.locator('fl-league-new-dialog')).toBeVisible();
      await shot('21-new-league', false);
      await page.keyboard.press('Escape');
      await expect(page.locator('fl-league-new-dialog')).toBeHidden();

      // From the league page: the league switcher, "What are we playing?", a game, a tournament.
      await page.goto(league);
      await expect(page.locator('fl-ranking .row').first()).toBeVisible();
      // The app's menu (a wide screen has its things in the rail instead).
      const menu = page.getByRole('button', { name: t('appMenu.open') });
      if (await menu.isVisible()) {
        await menu.click();
        await expect(page.locator('fl-app-menu')).toBeVisible();
        await shot('22-app-menu', false);
        await page.keyboard.press('Escape');
        await expect(page.locator('fl-app-menu')).toBeHidden();
      }
      await page.getByRole('button', { name: t('switcher.open', { name: 'Biuro 2026' }) }).click();
      await expect(page.locator('fl-league-switcher')).toBeVisible();
      await shot('23-league-switcher', false);
      await page.keyboard.press('Escape');
      await expect(page.locator('fl-league-switcher')).toBeHidden();
      const play = page.locator('nav.tabs button.play:visible, nav.fl-rail .new-play:visible');
      const sheet = page.locator('fl-new-play-sheet');
      await play.click();
      await expect(sheet).toBeVisible();
      await shot('24-new-play', false);
      await sheet
        .locator('button.option')
        .filter({ hasText: t('play.game') })
        .click();
      const newGame = page.locator('fl-game-new-dialog');
      await expect(newGame).toBeVisible();
      await shot('25-new-game', false);
      await page.keyboard.press('Escape');
      await expect(newGame).toBeHidden();
      await play.click();
      await sheet
        .locator('button.option')
        .filter({ hasText: t('play.tournament') })
        .click();
      await expect(page.locator('fl-tournament-new-dialog')).toBeVisible();
      await shot('26-new-tournament', false);
      await page.keyboard.press('Escape');
      await expect(page.locator('fl-tournament-new-dialog')).toBeHidden();

      // The game being played, last: leaving it would ask first.
      await page.goto(`/#/game/${data.running}`);
      await expect(page.locator('fl-table')).toBeVisible();
      await shot('27-game-running', false);
      await page.getByRole('button', { name: t('game.pause'), exact: true }).click();
      await expect(page.locator('fl-pause-overlay')).toBeVisible();
      await shot('28-game-paused', false);
      await page
        .locator('fl-pause-overlay')
        .getByRole('button', { name: t('game.resume') })
        .click();
      await expect(page.locator('fl-pause-overlay')).toBeHidden();
    });
  });
}

/** Names that strain a layout: very long, very short, Polish letters, two words of the same. */
const AWKWARD_NAMES = [
  'Krzysztof-Maksymilian Brzęczyszczykiewicz',
  'Bo',
  'Żaneta Ślęczkowska-Wójtowicz',
  'Łukasz',
  'Małgorzata Zielińska-Nowakowska',
  'Xi',
  'Grzegorz Brzęczyszczykiewicz',
  'Anna Maria',
  'Zbigniew',
  'Ola',
  'Piotr Wiśniewski',
  'Kasia',
  'Tomasz Ołdakowski',
  'Jędrzej',
  'Natalia Nowak',
  'Wiktor',
];
const AWKWARD_KITS: (Record<string, Value> | null)[] = AWKWARD_NAMES.map((_, i) =>
  i % 3 === 2
    ? null
    : {
        pattern: ['plain', 'stripes', 'hoops', 'halves', 'sash', 'quarters'][i % 6],
        c1: ['white', 'black', 'yellow', 'red', 'blue', 'green', 'maroon', 'orange'][i % 8],
        c2: ['black', 'white', 'blue', 'yellow', 'white', 'black', 'orange', 'maroon'][i % 8],
        ...(i % 4 === 3 ? {} : { num: [88, 99, 7, 1, 23, 10][i % 6] }),
      },
);

interface AwkwardSeed {
  league: string;
  players: string[];
  longGame: string;
  running: string;
  tournament: string;
}

let awkward: Promise<AwkwardSeed> | undefined;

for (const size of SIZES.filter((s) =>
  ['1-phone-small', '2-phone', '4-desktop'].includes(s.name),
)) {
  test.describe(`${size.name}, awkward data`, () => {
    test.use({
      viewport: size.viewport,
      deviceScaleFactor: size.scale,
      isMobile: size.mobile,
      hasTouch: size.mobile,
    });

    test('every screen with awkward data', async ({ page, request }) => {
      test.setTimeout(300_000);
      const data = await (awkward ??= seedAwkward(request));
      // This phone belongs to the player with the longest name.
      await page.addInitScript((me) => localStorage.setItem('fl.me', me), data.players[0]);
      const shot = shooter(page, size.name);
      const league = `/#/l/${data.league}`;
      const [a, b] = data.players;

      await page.goto(league);
      await expect(page.locator('fl-ranking .row').first()).toBeVisible();
      await shot('awkward-01-ranking');
      for (const [view, name] of [
        ['league.duets', 'awkward-02-duets'],
        ['potato.title', 'awkward-03-potato'],
      ]) {
        const radio = page.getByRole('radio', { name: t(view) });
        if (await radio.isEnabled()) {
          await radio.click();
          await shot(name);
        }
      }
      await page.getByRole('radio', { name: 'Elo' }).click();
      await page.goto(`${league}/games`);
      await expect(page.locator('fl-game-list .day').first()).toBeVisible();
      await shot('awkward-04-games');
      await page.goto(`${league}/stats`);
      await expect(page.locator('fl-league-stats canvas').first()).toBeVisible();
      await shot('awkward-05-stats');
      await page.goto(`${league}/players`);
      await expect(page.locator('fl-league-players fl-avatar').first()).toBeVisible();
      await shot('awkward-06-players');
      await page.goto(`${league}/player/${a}`);
      await expect(page.locator('section.hero')).toBeVisible();
      await shot('awkward-07-profile');
      await page.getByRole('tab', { name: t('player.tabs.stats') }).click();
      await shot('awkward-08-profile-stats');
      await page.goto(`${league}/compare/${a}/${b}`);
      await expect(page.locator('fl-compare-page')).toBeVisible();
      await shot('awkward-09-compare');
      await page.goto(`${league}/t/${data.tournament}`);
      await expect(page.locator('fl-tournament-page')).toBeVisible();
      await shot('awkward-10-tournament');
      await page.goto(`${league}/tournaments`);
      await shot('awkward-11-tournaments');
      await page.goto(`/#/game/${data.longGame}`);
      await expect(page.locator('fl-game-timeline')).toBeVisible();
      await shot('awkward-12-game-finished');
      await page.goto(league);
      await expect(page.locator('fl-ranking .row').first()).toBeVisible();
      await page
        .getByRole('button', { name: t('switcher.open', { name: AWKWARD_LEAGUE }) })
        .click();
      await expect(page.locator('fl-league-switcher')).toBeVisible();
      await shot('awkward-13-league-menu', false);
      await page.keyboard.press('Escape');
      await page.goto(`/#/game/${data.running}`);
      await expect(page.locator('fl-table')).toBeVisible();
      await shot('awkward-14-game-running', false);
    });
  });
}

const AWKWARD_LEAGUE = 'Międzynarodowa Liga Piłkarzyków Działu Księgowości i Kadr 2026';

/**
 * A league that strains the layout: a long name, 16 players (three without games), 120 games
 * over two months with long win-by-two games, one on one and timed ones, a game being played
 * and one paused, and a tournament with a long name.
 */
async function seedAwkward(request: APIRequestContext): Promise<AwkwardSeed> {
  const id = tag();
  const put = async (path: string, data: Record<string, Value>): Promise<void> => {
    expect(await create(request, path, data, OWNER), path).toBe(200);
  };
  const now = Date.now();
  const players = AWKWARD_NAMES.map((_, i) => `awk-${id}-p${i}`);
  await Promise.all(
    players.map((player, i) => {
      const kit = AWKWARD_KITS[i];
      return put(
        `players/${player}`,
        kit ? { name: AWKWARD_NAMES[i], kit } : { name: AWKWARD_NAMES[i] },
      );
    }),
  );
  const league = `awk-${id}`;
  const tournament = `awk-${id}-t`;
  await put(`leagues/${league}`, {
    name: AWKWARD_LEAGUE,
    created: iso(now - 70 * DAY),
    players,
    minGames: 5,
  });
  const active = players.slice(0, 13);
  await put(`tournaments/${tournament}`, {
    league,
    name: 'Wielki Jesienny Turniej o Puchar Prezesa i Złotą Piłeczkę',
    format: 'open',
    created: iso(now - 3 * DAY),
    mode: MODE,
    teamSize: 2,
    entries: active.slice(0, 8).map((player, i) => ({ player, at: iso(now - 3 * DAY + i * 1000) })),
  });

  const random = mulberry32(13);
  const games: Record<string, Value>[] = [];
  for (let n = 0; n < 120; n++) {
    const daysAgo = 60 - Math.floor(n / 2);
    const start = now - daysAgo * DAY - 4 * 3600_000 + (n % 2) * 1800_000;
    const kind = n % 10;
    // The first player plays most, the rest less and less.
    const pool = shuffle(active, random).sort(() => random() - 0.6);
    const four = (n % 3 === 0 ? [active[0], ...pool.filter((p) => p !== active[0])] : pool).slice(
      0,
      4,
    );
    const long = kind === 3 || n === 119;
    const solo = kind === 5;
    const timed = kind === 7;
    const lineup = solo ? [four[0], four[0], four[1], four[1]] : four;
    const [winGoals, loseGoals] = long ? [15, 13] : timed ? [4, 3] : [8, Math.floor(random() * 7)];
    games.push({
      ...match(
        random,
        lineup,
        winGoals,
        loseGoals,
        start,
        timed ? { target: 8, minutes: 5 } : MODE,
      ),
      league,
      ...(daysAgo <= 3 && !solo ? { tournament } : {}),
    });
  }
  await Promise.all(games.map((data, n) => put(`games/awk-${id}-g${n}`, data)));

  // Being played: the two longest names against each other's partners, 6:6 in a long game.
  const running = match(
    random,
    [players[0], players[2], players[4], players[6]],
    6,
    6,
    now - 9 * 60_000,
    MODE,
  );
  delete running['end'];
  delete running['win'];
  await put(`games/awk-${id}-live`, { ...running, league });
  const paused = match(
    random,
    [players[1], players[3], players[5], players[7]],
    3,
    2,
    now - 40 * 60_000,
    MODE,
  );
  delete paused['end'];
  delete paused['win'];
  await put(`games/awk-${id}-paused`, {
    ...paused,
    league,
    paused: iso(now - 30 * 60_000),
    pausedFor: 0,
  });

  return { league, players, longGame: `awk-${id}-g119`, running: `awk-${id}-live`, tournament };
}

/**
 * A game with given goals: `winGoals` for the winner (the first two players are red, unless the
 * random draw makes blue win), `loseGoals` for the loser, the winner's goal last. Players may
 * repeat (one on one: the same player in defence and attack).
 */
function match(
  random: () => number,
  [redDefence, redOffence, blueDefence, blueOffence]: string[],
  winGoals: number,
  loseGoals: number,
  start: number,
  mode: Record<string, Value>,
): Record<string, Value> {
  const lineup = {
    red: { defence: redDefence, offence: redOffence },
    blue: { defence: blueDefence, offence: blueOffence },
  };
  const win = random() < 0.5 ? 'red' : 'blue';
  const lose = win === 'red' ? 'blue' : 'red';
  const order: ('red' | 'blue')[] =
    winGoals === loseGoals
      ? shuffle([...Array(winGoals).fill(win), ...Array(loseGoals).fill(lose)], random)
      : [
          ...shuffle([...Array(winGoals - 1).fill(win), ...Array(loseGoals).fill(lose)], random),
          win,
        ];
  const scored = { red: { defence: 0, offence: 0 }, blue: { defence: 0, offence: 0 } };
  const events: Value[] = [];
  let at = 0;
  for (const team of order) {
    at += 20_000 + Math.floor(random() * 40_000);
    const position = random() < 0.5 ? 'defence' : 'offence';
    scored[team][position]++;
    events.push({ at, type: 'goal', team, position, player: lineup[team][position] });
  }
  const side = (team: 'red' | 'blue') => ({
    defence: { player: lineup[team].defence, goals: scored[team].defence, ownGoals: 0 },
    offence: { player: lineup[team].offence, goals: scored[team].offence, ownGoals: 0 },
  });
  return {
    players: [...new Set([redDefence, redOffence, blueDefence, blueOffence])],
    start: iso(start),
    end: iso(start + at + 5_000),
    win,
    teams: { red: side('red'), blue: side('blue') },
    mode,
    events,
  };
}

/** Takes a screenshot (the whole page unless `fullPage` is false) and checks for sideways scroll. */
function shooter(page: Page, size: string) {
  return async (name: string, fullPage = true): Promise<void> => {
    // No hover left over from the last click (evaluations 11, 12 read it as a highlight).
    const viewport = page.viewportSize();
    if (viewport) {
      await page.mouse.move(viewport.width - 2, 2);
    }
    // Charts and fonts settle.
    await page.waitForTimeout(500);
    await page.screenshot({
      path: join(__dirname, '..', 'screenshots', 'tour', size, `${name}.png`),
      fullPage,
      animations: 'disabled',
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect
      .soft(overflow, `${size}/${name}: the page is wider than the screen`)
      .toBeLessThanOrEqual(1);
    const path = join(__dirname, '..', 'screenshots', 'tour', size, `${name}.json`);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(await page.evaluate(audit), null, 1));
  };
}

/**
 * What a design review checks by measuring (runs in the page): how many blocks start at each
 * left edge (a few edges is a grid, many is misalignment), the texts an ellipsis cuts, and the
 * tap targets smaller than 40 px.
 */
function audit() {
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const label = (el: Element) =>
    (el.getAttribute('aria-label') || el.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
  const root =
    document.querySelector('.cdk-overlay-pane') ?? document.querySelector('main') ?? document.body;
  const lefts: Record<string, { n: number; e: string[] }> = {};
  for (const el of root.querySelectorAll(
    'h1, h2, h3, p, section, ol, ul, table, a, button, label, .card',
  )) {
    if (!visible(el)) {
      continue;
    }
    const edge = (lefts[String(Math.round(el.getBoundingClientRect().left))] ??= { n: 0, e: [] });
    edge.n++;
    if (edge.e.length < 3) {
      edge.e.push(`${el.tagName.toLowerCase()} ${label(el)}`);
    }
  }
  const truncated = [...root.querySelectorAll('*')]
    .filter((el) => {
      const s = getComputedStyle(el);
      return s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && visible(el);
    })
    .map(label);
  const small = [...document.querySelectorAll('a, button, [role=radio], [role=tab]')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return visible(el) && (r.width < 40 || r.height < 40);
    })
    .map((el) => {
      const r = el.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)} ${label(el)}`;
    });
  return { width: window.innerWidth, lefts, truncated, small };
}

/** Writes a league with seven players, 30 finished games, a game being played and a tournament. */
async function seed(request: APIRequestContext): Promise<Seed> {
  const id = tag();
  const put = async (path: string, data: Record<string, Value>): Promise<void> => {
    expect(await create(request, path, data, OWNER), path).toBe(200);
  };
  const now = Date.now();
  const players = NAMES.map((_, i) => `tour-${id}-p${i}`);
  await Promise.all(
    players.map((player, i) => {
      const kit = KITS[i];
      return put(`players/${player}`, kit ? { name: NAMES[i], kit } : { name: NAMES[i] });
    }),
  );
  const league = `tour-${id}`;
  const empty = `tour-${id}-empty`;
  const tournament = `tour-${id}-t`;
  await put(`leagues/${league}`, { name: 'Biuro 2026', created: iso(now - 40 * DAY), players });
  await put(`leagues/${empty}`, {
    name: 'Wyjazd w góry',
    created: iso(now - DAY),
    players: players.slice(0, 4),
  });
  const entrants = players.slice(0, 4);
  await put(`tournaments/${tournament}`, {
    league,
    name: 'Turniej piątkowy',
    format: 'open',
    created: iso(now - 2 * DAY),
    mode: MODE,
    teamSize: 2,
    entries: entrants.map((player, i) => ({ player, at: iso(now - 2 * DAY + i * 1000) })),
  });

  const random = mulberry32(2026);
  const games: Record<string, Value>[] = [];
  for (let n = 0; n < 30; n++) {
    // Twelve days back to today, a few games a day around lunch.
    const daysAgo = 12 - Math.floor((n * 12) / 30);
    const start = now - daysAgo * DAY - 3 * 3600_000 + (n % 3) * 1500_000;
    const inTournament = daysAgo === 2;
    const pool = inTournament ? entrants : players;
    games.push({
      ...game(random, shuffle(pool, random).slice(0, 4), start, 8),
      league,
      ...(inTournament ? { tournament } : {}),
    });
  }
  await Promise.all(games.map((data, n) => put(`games/tour-${id}-g${n}`, data)));

  // The game being played: started four minutes ago, 3:2.
  const running = game(random, shuffle(players, random).slice(0, 4), now - 4 * 60_000, 5);
  delete running['end'];
  delete running['win'];
  await put(`games/tour-${id}-live`, { ...running, league });

  return {
    league,
    empty,
    players,
    finished: `tour-${id}-g29`,
    running: `tour-${id}-live`,
    tournament,
  };
}

/**
 * A game of four players with its goal log: `goals` goals in all; with 8 or more the winner
 * reaches 8 and the loser stays at 6 or below (a two-goal lead).
 */
function game(
  random: () => number,
  [redDefence, redOffence, blueDefence, blueOffence]: string[],
  start: number,
  goals: number,
): Record<string, Value> {
  const lineup = {
    red: { defence: redDefence, offence: redOffence },
    blue: { defence: blueDefence, offence: blueOffence },
  };
  const win = random() < 0.5 ? 'red' : 'blue';
  const lose = win === 'red' ? 'blue' : 'red';
  const order: ('red' | 'blue')[] =
    goals >= 8
      ? [
          ...shuffle(
            [...Array(7).fill(win), ...Array(Math.floor(random() * 7)).fill(lose)],
            random,
          ),
          win,
        ]
      : shuffle(
          [
            ...Array(goals - Math.floor(goals / 2)).fill(win),
            ...Array(Math.floor(goals / 2)).fill(lose),
          ],
          random,
        );
  const scored = { red: { defence: 0, offence: 0 }, blue: { defence: 0, offence: 0 } };
  const events: Value[] = [];
  let at = 0;
  for (const team of order) {
    at += 15_000 + Math.floor(random() * 35_000);
    const position = random() < 0.5 ? 'defence' : 'offence';
    scored[team][position]++;
    events.push({ at, type: 'goal', team, position, player: lineup[team][position] });
  }
  const side = (team: 'red' | 'blue') => ({
    defence: { player: lineup[team].defence, goals: scored[team].defence, ownGoals: 0 },
    offence: { player: lineup[team].offence, goals: scored[team].offence, ownGoals: 0 },
  });
  return {
    players: [redDefence, redOffence, blueDefence, blueOffence],
    start: iso(start),
    end: iso(start + at + 5_000),
    win,
    teams: { red: side('red'), blue: side('blue') },
    mode: MODE,
    events,
  };
}

function iso(time: number): string {
  return new Date(time).toISOString();
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A small seeded random generator, so every tour plays the same games. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
