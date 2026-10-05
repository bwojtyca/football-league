import {
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom, interval, map, switchMap } from 'rxjs';

import { leagueOf } from '../../league/league';
import { K_FACTOR, START_RATING, winChance } from '../../player/rating';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { AvatarComponent } from '../../player/avatar/avatar.component';
import { PlayerService } from '../../player/player.service';
import { cssColor } from '../../shared/css-color';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { LeaveGuarded } from '../../shared/leave-guard';
import { keepScreenOn } from '../../shared/wake-lock';
import {
  decidedWinner,
  formatDuration,
  Game,
  GameEvent,
  GOAL_DETAILS,
  GoalDetail,
  isDefaultMode,
  lineupOf,
  lineupPlayers,
  modeOf,
  playTime,
  POSITIONS,
  Position,
  Rod,
  seriesScore,
  TEAM_COLORS,
  TeamColor,
  teamPlayers,
  winsNeeded,
  teamScore,
  timeLeft,
} from '../game';
import { GameService } from '../game.service';
import { openNewGameDialog } from '../game-new/game-new-dialog/game-new-dialog.component';
import { openGameTimeline } from '../game-timeline/game-timeline.component';
import { ModeLabelComponent } from '../mode/mode-label.component';
import { FinishPanelComponent, FinishPlayer } from './finish-panel.component';
import { openLeaveDialog } from './leave-dialog.component';
import { PauseOverlayComponent } from './pause-overlay.component';
import { TableComponent, TableGoal } from './table.component';

/** A decided game waits this long (for an undo, or "Next") before its result is recorded. */
const FINISH_AFTER_MS = 8000;

const ROTATION_KEY = 'fl.rotation';
const DETAIL_KEY = 'fl.goalDetail';
/** "Own goal…" waits this long for the rod or figure that scored it. */
const OWN_GOAL_PICK_MS = 6000;

/** Cells clockwise from the top left when the table is not turned. */
const CELL_ORDER = ['red-offence', 'red-defence', 'blue-offence', 'blue-defence'];
/** Grid areas of the corners, clockwise from the top left. */
const CORNERS = ['1 / 1', '1 / 2', '2 / 2', '2 / 1'];
/** Middles of the lines between two cells: top, right, bottom and left, as [left, top] %. */
const EDGE_MIDDLES = [
  [50, 25],
  [75, 50],
  [50, 75],
  [25, 50],
] as const;

function readRotation(): number {
  try {
    return Number(localStorage.getItem(ROTATION_KEY)) % 4 || 0;
  } catch {
    return 0;
  }
}

function readDetail(): GoalDetail {
  try {
    const detail = localStorage.getItem(DETAIL_KEY) as GoalDetail;
    return GOAL_DETAILS.includes(detail) ? detail : 'position';
  } catch {
    return 'position';
  }
}

@Component({
  selector: 'fl-game-detail',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
    FinishPanelComponent,
    ModeLabelComponent,
    PauseOverlayComponent,
    RatingChangeComponent,
    TableComponent,
    TranslocoPipe,
  ],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.scss',
})
export class GameDetailComponent implements LeaveGuarded {
  private readonly _gameService = inject(GameService);
  private readonly _leagueService = inject(LeagueService);
  private readonly _dialog = inject(MatDialog);
  private readonly _bottomSheet = inject(MatBottomSheet);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _router = inject(Router);
  private readonly _notifier = inject(Notifier);
  private readonly _transloco = inject(TranslocoService);
  protected readonly playerService = inject(PlayerService);

  /** Game this device is already closing, so it is closed (and announced) only once. */
  private _closing?: string;
  /** Game scored on this device: when it ends, this device offers the rematch. */
  private _scoredHere?: string;
  /** Game whose win was already celebrated on this device. */
  private _celebrated?: string;
  /** Game removed on this device: leaving it needs no question. */
  private _removed?: string;

  protected readonly colors = TEAM_COLORS;
  protected readonly positions = POSITIONS;
  protected readonly teamNames = { red: 'team.red', blue: 'team.blue' } as const;
  protected readonly positionNames = {
    offence: 'position.offence',
    defence: 'position.defence',
  } as const;

  /** `undefined` while loading, `null` when the game does not exist. */
  protected readonly game = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((params) => this._gameService.getGame(params.get('gameId') ?? '')),
    ),
  );

  protected readonly leagueId = computed(() => {
    const game = this.game();
    return game ? leagueOf(game) : null;
  });

  /** Where the back arrow leads: the tournament of the game, or its league. */
  protected readonly backLink = computed(() => {
    const game = this.game();
    const leagueId = this.leagueId();
    return game?.tournament ? ['/l', leagueId, 't', game.tournament] : ['/l', leagueId];
  });

  protected readonly canRematch = computed(() => {
    const leagueId = this.leagueId();
    const league = leagueId ? this._leagueService.league(leagueId) : null;
    return !!league && !league.archived;
  });

  /** Rating change of each player, once the game is finished. */
  private readonly _changes = computed(() => {
    const game = this.game();
    const leagueId = this.leagueId();
    return game?.end && leagueId
      ? this._gameService.ratings(leagueId)?.changes.get(game.id)
      : undefined;
  });

  protected readonly score = computed(() => {
    const game = this.game();
    return {
      red: game ? teamScore(game, 'red') : 0,
      blue: game ? teamScore(game, 'blue') : 0,
    };
  });

  private readonly _now = toSignal(interval(1000).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  /** Winner of a running game that is over (on goals, or when the time is up). */
  protected readonly decided = computed(() => {
    const game = this.game();
    return game && !game.end ? decidedWinner(game, this._now()) : undefined;
  });

  /** Time played, or for a running timed game the time left; `golden` on a tie after it. */
  protected readonly clock = computed(() => {
    const game = this.game();
    if (!game) {
      return { time: '', golden: false };
    }
    const now = game.end ? Date.parse(game.end) : this._now();
    const left = game.end ? undefined : timeLeft(game, now);
    if (left === undefined) {
      return { time: formatDuration(playTime(game, now) / 1000), golden: false };
    }
    return { time: formatDuration(Math.ceil(left)), golden: left <= 0 };
  });

  /** Rules shown next to the clock; nothing for the usual game to 8. */
  protected readonly mode = computed(() => {
    const game = this.game();
    return game && !isDefaultMode(game.mode) ? modeOf(game) : null;
  });

  protected readonly series = computed(() => {
    const game = this.game();
    if (!game?.series) {
      return null;
    }
    const games = this._gameService.seriesGames(game) ?? [];
    const score = seriesScore(game, games);
    const { bestOf, game: number } = game.series;
    // Only the latest game of an unfinished series leads to the next one.
    const isLatest = games.at(-1)?.id === game.id;
    const next = game.end && !score.winner && isLatest && number < bestOf ? number + 1 : null;
    return { ...score, bestOf, number, next };
  });

  protected readonly lastEvent = computed(() => {
    const game = this.game();
    return game && !game.end ? game.events?.at(-1) : undefined;
  });

  /** Names of the winning team (decided or finished). */
  protected readonly winners = computed(() => {
    const game = this.game();
    const winner = this.decided() ?? game?.win;
    return game && winner
      ? lineupPlayers(lineupOf(game.teams[winner]))
          .map((player) => this.playerService.getPlayerName(player))
          .join(' & ')
      : '';
  });

  /** Elo change of each player once the decided game is recorded, winners first. */
  protected readonly preview = computed<FinishPlayer[]>(() => {
    const game = this.game();
    const winner = this.decided();
    const leagueId = this.leagueId();
    if (!game || !winner || !leagueId) {
      return [];
    }
    const current = this._gameService.ratings(leagueId)?.current;
    const team = (color: TeamColor) => {
      const players = teamPlayers(game.teams[color]);
      return (
        players.reduce((sum, id) => sum + (current?.get(id) ?? START_RATING), 0) / players.length
      );
    };
    const loser: TeamColor = winner === 'red' ? 'blue' : 'red';
    const gain = K_FACTOR * (1 - winChance(team(winner), team(loser)));
    return [winner, loser].flatMap((color) =>
      teamPlayers(game.teams[color]).map((id) => ({
        id,
        name: this.playerService.getPlayerName(id),
        change: Math.round(color === winner ? gain : -gain),
      })),
    );
  });

  /** Where a series stands once the decided game is recorded. */
  protected readonly seriesNote = computed(() => {
    const series = this.series();
    const winner = this.decided();
    if (!series || !winner) {
      return '';
    }
    const score = { red: series.red, blue: series.blue };
    score[winner]++;
    return score[winner] >= winsNeeded(series.bestOf)
      ? this._transloco.translate('series.won', {
          team: this._transloco.translate(this.teamNames[winner]),
        })
      : this._transloco.translate('series.score', score);
  });

  constructor() {
    const landscape = matchMedia('(orientation: landscape)');
    const onTurn = (event: MediaQueryListEvent) => this._wide.set(event.matches);
    landscape.addEventListener('change', onTurn);
    inject(DestroyRef).onDestroy(() => landscape.removeEventListener('change', onTurn));
    // A decided game shows the finish panel for a few seconds (time to undo the last goal or
    // tap "Next"); then any device showing it records the result, and the device used for
    // scoring moves on.
    effect((onCleanup) => {
      const game = this.game();
      if (game && this.decided() && this._closing !== game.id) {
        const timer = setTimeout(
          () => this._closeDecided(game.id, this._scoredHere === game.id),
          FINISH_AFTER_MS,
        );
        onCleanup(() => clearTimeout(timer));
      }
    });
    // Confetti in the winners' colour, once per decided game.
    effect(() => {
      const game = this.game();
      const winner = this.decided();
      if (game && winner && this._celebrated !== game.id) {
        this._celebrated = game.id;
        this._celebrate(winner);
      }
    });
    keepScreenOn(() => {
      const game = this.game();
      return !!game && !game.end;
    });
  }

  protected change(playerId: string): number | null {
    const change = this._changes()?.get(playerId);
    return change === undefined ? null : Math.round(change);
  }

  /**
   * How the table lies, in quarter turns clockwise (kept on this device). At 0 it is seen from
   * the blue side: red offence and defence on top, blue defence and offence below. On a phone
   * lying flat, 1 and 3 show the landscape layout turned a quarter one way or the other.
   */
  protected readonly rotation = signal(readRotation());

  /** The screen itself is landscape: a phone held sideways, a tablet, a computer. */
  private readonly _wide = signal(matchMedia('(orientation: landscape)').matches);

  /** The landscape layout (the table beside a panel): on a landscape screen, or turned. */
  protected readonly landscape = computed(() => this._wide() || this.rotation() % 2 === 1);

  /** On a portrait screen the landscape layout is turned a quarter, so it works lying flat. */
  protected readonly turn = computed(() =>
    this._wide() || this.rotation() % 2 === 0 ? null : this.rotation() === 1 ? 'cw' : 'ccw',
  );

  /**
   * Quarter turns of the table inside the layout. The landscape layout always shows the table
   * lengthwise, from the blue side (0) or, on a landscape screen turned once more, the red (2).
   */
  protected readonly tableTurn = computed(() => {
    const rotation = this.rotation();
    if (!this.landscape()) {
      return rotation;
    }
    return this._wide() && rotation >= 2 ? 2 : 0;
  });

  /**
   * A quarter turn on a portrait screen; on a landscape one, the other side of the table. The
   * whole table (rod, figure) only turns between the two landscape quarters.
   */
  protected rotate(): void {
    const rotation = this.rotation();
    const step = this._wide() || (this.tableMode() && rotation % 2 === 1) ? 2 : 1;
    this._setRotation((rotation + step) % 4);
  }

  /** "Done, it's sideways" on the prompt: the landscape layout, on the same side of the table. */
  protected turnDone(): void {
    this._setRotation(this.rotation() === 2 ? 3 : 1);
  }

  private _setRotation(rotation: number): void {
    this.rotation.set(rotation);
    try {
      localStorage.setItem(ROTATION_KEY, String(rotation));
    } catch {
      // Not remembered: private mode or storage blocked.
    }
  }

  /**
   * How much a goal tells: the position, the rod or the figure (kept on this device, so the
   * next game opens the same way). A game can mix them.
   */
  protected readonly detail = signal<GoalDetail>(readDetail());
  protected readonly detailIcons = { position: 'person', rod: 'view_week', man: 'groups' };

  protected cycleDetail(): void {
    const detail = GOAL_DETAILS[(GOAL_DETAILS.indexOf(this.detail()) + 1) % GOAL_DETAILS.length];
    this._setDetail(detail);
    this._snackBar.open(
      this._transloco.translate('game.detail', {
        level: this._transloco.translate(`game.detailLevel.${detail}`),
      }),
      undefined,
      { duration: 1500 },
    );
  }

  /** "Record only who scored" on the prompt to turn the phone. */
  protected whoOnly(): void {
    this._setDetail('position');
  }

  private _setDetail(detail: GoalDetail): void {
    this.detail.set(detail);
    this.ownArmed.set(false);
    try {
      localStorage.setItem(DETAIL_KEY, detail);
    } catch {
      // Not remembered: private mode or storage blocked.
    }
  }

  /** Goals told by rod or figure, on the whole table: a running game with a log. */
  protected readonly tableMode = computed(() => {
    const game = this.game();
    return this.detail() !== 'position' && !!game && !game.end && !!game.events;
  });

  /** The whole table needs the landscape layout; a portrait one asks to turn the phone. */
  protected readonly askTurn = computed(() => this.tableMode() && !this.landscape());

  /** "Own goal…": the next rod or figure tapped scored into its own goal. */
  protected readonly ownArmed = signal(false);
  private _ownTimer?: ReturnType<typeof setTimeout>;

  protected toggleOwn(): void {
    clearTimeout(this._ownTimer);
    this.ownArmed.set(!this.ownArmed());
    if (this.ownArmed()) {
      this._ownTimer = setTimeout(() => this.ownArmed.set(false), OWN_GOAL_PICK_MS);
    }
  }

  /** A goal told on the whole table; an own goal when "Own goal…" was armed. */
  protected tableGoal({ color, position, rod, man }: TableGoal): void {
    const own = this.ownArmed();
    this.ownArmed.set(false);
    clearTimeout(this._ownTimer);
    this.goal(color, position, own, { rod, man });
  }

  /** The translation key that tells the last goal, as precisely as it was entered. */
  protected eventKey(event: Exclude<GameEvent, { type: 'swap' }>): string {
    const kind = event.type === 'own' ? 'own' : 'goal';
    return `game.event.${kind}${event.man ? 'Man' : event.rod ? 'Rod' : ''}`;
  }

  /** An event as the log tells it, e.g. "Ala scores from defence". */
  protected eventText(event: GameEvent | undefined): string {
    const translate = (key: string, params?: Record<string, unknown>) =>
      this._transloco.translate(key, params);
    if (!event) {
      return '';
    }
    if (event.type === 'swap') {
      return translate('game.event.swap', { team: translate(this.teamNames[event.team]) });
    }
    return translate(this.eventKey(event), {
      name: this.playerService.getPlayerName(event.player),
      from: translate(
        event.position === 'defence' ? 'position.fromDefence' : 'position.fromOffence',
      ),
      rod: event.rod ? translate(`rods.with.${event.rod}`) : '',
      n: event.man ?? '',
    });
  }

  /** The grid cell of a player: the corners clockwise from the top left, turned. */
  protected area(color: TeamColor, position: Position): string {
    const start = CELL_ORDER.indexOf(`${color}-${position}`);
    return CORNERS[(start + this.tableTurn()) % 4];
  }

  /** Where a team's swap button sits: on the line between its two cells, in % of the table. */
  protected swapSpot(color: TeamColor): readonly [number, number] {
    return EDGE_MIDDLES[(this.tableTurn() + (color === 'red' ? 0 : 2)) % 4];
  }

  protected canSwap(game: Game, color: TeamColor): boolean {
    const team = game.teams[color];
    return (
      !game.end && !!game.events && !this.decided() && team.defence.player !== team.offence.player
    );
  }

  /** "Next" on the finish panel: record the result now and move on. */
  protected next(): void {
    const game = this.game();
    if (game && this.decided()) {
      this._closeDecided(game.id, true);
    }
  }

  /** A game whose clock runs: started, not decided, not paused. */
  private _running(): boolean {
    const game = this.game();
    return !!game && !game.end && !game.paused && !game.deleted && !this.decided();
  }

  /** Leaving a running game asks whether to pause it first. */
  public canLeave(): boolean | Promise<boolean> {
    if (!this._running() || this._removed === this.game()?.id) {
      return true;
    }
    return firstValueFrom(openLeaveDialog(this._dialog).afterClosed()).then((choice) => {
      if (choice === 'pause') {
        this.pause();
      }
      return choice === 'pause' || choice === 'leave';
    });
  }

  /** Closing the tab or the browser during a running game asks the browser to confirm. */
  @HostListener('window:beforeunload', ['$event'])
  protected warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this._running()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  protected pause(): void {
    const game = this.game();
    if (game && !game.end && !game.paused) {
      this._gameService.pause(game).catch((error) => this._notifier.error('error.pause', error));
    }
  }

  protected resume(): void {
    const game = this.game();
    if (game?.paused) {
      this._gameService.resume(game).catch((error) => this._notifier.error('error.pause', error));
    }
  }

  protected goal(
    color: TeamColor,
    position: Position,
    ownGoal = false,
    where: { rod?: Rod; man?: number } = {},
  ): void {
    const game = this.game();
    if (!game || game.end || game.paused || this.decided()) {
      return;
    }
    this._scoredHere = game.id;
    this._gameService
      .scoreGoal(game, color, position, ownGoal, where)
      .catch((error) => this._notifier.error('error.goal', error));
  }

  protected swap(color: TeamColor): void {
    const game = this.game();
    if (game && this.canSwap(game, color)) {
      this._gameService
        .swapPositions(game, color)
        .catch((error) => this._notifier.error('error.swap', error));
    }
  }

  protected undo(): void {
    const game = this.game();
    if (game && !game.end && game.events?.length) {
      this._gameService.undo(game).catch((error) => this._notifier.error('error.undo', error));
    }
  }

  /** How a finished game went (from its log) and where it stands among the league's games. */
  protected showTimeline(): void {
    const game = this.game();
    if (game?.end) {
      openGameTimeline(this._bottomSheet, game);
    }
  }

  /** "How it went" on the finish card: records the result now, stays here and shows it. */
  protected async howItWent(): Promise<void> {
    const game = this.game();
    const winner = this.decided();
    if (!game || !winner) {
      return;
    }
    await this._closeDecided(game.id, false);
    // The closed game may not have come back from the server yet.
    const latest = this.game();
    openGameTimeline(
      this._bottomSheet,
      latest?.end ? latest : { ...game, end: new Date().toISOString(), win: winner },
    );
  }

  /** "Leave, finish later" on a paused game: it waits paused at the top of the games. */
  protected leaveForLater(): void {
    this._router.navigate(this.backLink());
  }

  protected rematch(): void {
    const game = this.game();
    const leagueId = this.leagueId();
    if (game && leagueId && this.canRematch()) {
      openNewGameDialog(this._dialog, { leagueId, previousGame: game });
    }
  }

  /** Starts the next game of the series: the teams swap colours and keep their positions. */
  protected nextInSeries(): void {
    const game = this.game();
    const next = this.series()?.next;
    const leagueId = this.leagueId();
    if (!game?.series || !next || !leagueId) {
      return;
    }
    const { id, saved } = this._gameService.createGame(
      leagueId,
      lineupOf(game.teams.blue),
      lineupOf(game.teams.red),
      modeOf(game),
      { series: { ...game.series, game: next } },
    );
    saved.catch((error) => this._notifier.error('error.newGame', error));
    this._router.navigate(['/game', id]);
  }

  protected remove(): void {
    const game = this.game();
    const leagueId = this.leagueId();
    if (
      !game ||
      !leagueId ||
      game.win ||
      !confirm(this._transloco.translate('game.removeConfirm'))
    ) {
      return;
    }
    this._removed = game.id;
    this._gameService
      .deleteGame(game.id)
      .catch((error) => this._notifier.error('error.remove', error));
    if (game.tournament) {
      this._router.navigate(this.backLink());
    } else {
      openNewGameDialog(this._dialog, { leagueId, previousGame: game });
    }
  }

  /** Deletes a finished game (it can be restored), with an undo right away. */
  protected deleteFinished(): void {
    const game = this.game();
    if (!game?.end || !confirm(this._transloco.translate('game.deleteConfirm'))) {
      return;
    }
    this._setDeleted(game.id, true);
    this._snackBar
      .open(this._transloco.translate('game.deleted'), this._transloco.translate('game.undo'), {
        duration: 8000,
      })
      .onAction()
      .subscribe(() => this._setDeleted(game.id, false));
  }

  protected restore(): void {
    const game = this.game();
    if (game) {
      this._setDeleted(game.id, false);
    }
  }

  private async _celebrate(winner: TeamColor): Promise<void> {
    const { default: confetti } = await import('canvas-confetti');
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.65 },
      colors: [cssColor(winner === 'red' ? '--fl-red' : '--fl-blue'), cssColor('--fl-ball')],
      disableForReducedMotion: true,
    });
  }

  private _setDeleted(gameId: string, deleted: boolean): void {
    this._gameService
      .setDeleted(gameId, deleted)
      .catch((error) => this._notifier.error('error.remove', error));
  }

  /**
   * Records the result once every goal from this device has reached the server. With
   * `moveOn` (the device used for scoring, or someone tapped "Next") it then goes back to the
   * tournament, or offers a rematch unless a series goes on.
   */
  private async _closeDecided(gameId: string, moveOn: boolean): Promise<void> {
    await this._gameService.whenSaved();
    const game = this.game();
    if (
      game?.id !== gameId ||
      game.end ||
      !decidedWinner(game, Date.now()) ||
      this._closing === gameId
    ) {
      return;
    }
    this._closing = gameId;
    const winner = await this._gameService.closeGame(gameId).catch((error) => {
      this._closing = undefined;
      this._notifier.error('error.result', error);
      return undefined;
    });
    if (!winner || !moveOn) {
      return;
    }
    // In a tournament the next game is set up on the tournament page.
    if (game.tournament) {
      this._router.navigate(this.backLink());
      return;
    }
    const played = (this._gameService.seriesGames(game) ?? []).map((other) =>
      other.id === gameId ? { ...other, win: winner } : other,
    );
    if (!game.series || seriesScore(game, played).winner) {
      this.rematch();
    }
  }
}
