import { Component, computed, DOCUMENT, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { distinctUntilChanged, filter, map, of, switchMap, timer } from 'rxjs';

import { GameService } from './game/game.service';
import { LeagueService } from './league/league.service';
import { PlayerService } from './player/player.service';

@Component({
  selector: 'fl-root',
  imports: [RouterOutlet, TranslocoPipe],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly _document = inject(DOCUMENT);
  private readonly _transloco = inject(TranslocoService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _games = inject(GameService);
  private readonly _leagues = inject(LeagueService);
  private readonly _players = inject(PlayerService);

  /** A page on its way: shown only if it takes longer than a blink. */
  private readonly _navigating = toSignal(
    inject(Router).events.pipe(
      filter(
        (event) =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError,
      ),
      map((event) => event instanceof NavigationStart),
      distinctUntilChanged(),
      switchMap((started) => (started ? timer(150).pipe(map(() => true)) : of(false))),
    ),
    { initialValue: false },
  );

  /** The progress bar on top: a page loading, or the data not there yet. */
  protected readonly busy = computed(
    () =>
      this._navigating() ||
      this._games.games() === undefined ||
      this._leagues.leagues() === undefined ||
      this._players.players() === undefined,
  );

  constructor() {
    this._transloco.langChanges$
      .pipe(takeUntilDestroyed())
      .subscribe((lang) => (this._document.documentElement.lang = lang));

    // The service worker fetches a new deploy in the background; offer to switch to it.
    inject(SwUpdate)
      .versionUpdates.pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(),
      )
      .subscribe(() => this._offerReload());
  }

  private _offerReload(): void {
    this._snackBar
      .open(this._transloco.translate('app.updateReady'), this._transloco.translate('app.reload'))
      .onAction()
      .subscribe(() => this._document.location.reload());
  }
}
