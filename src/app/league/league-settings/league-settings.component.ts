import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameService } from '../../game/game.service';
import { Notifier } from '../../notifier';
import { TopBarComponent } from '../../shared/top-bar.component';
import { League } from '../league';
import { openLeagueDeleteDialog } from '../league-delete-dialog.component';
import { LeagueService } from '../league.service';

/** Choices for the fewest games a player needs to be ranked. */
const MIN_GAMES = [0, 3, 5, 10, 20, 50];

/**
 * The league's settings (canvas P18): its name, the ranking threshold, locking new games, and
 * archiving or deleting it. Without sign-in anyone may change them; a moderator comes with it.
 */
@Component({
  selector: 'fl-league-settings',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    TopBarComponent,
    TranslocoPipe,
  ],
  template: `
    @let current = league();
    <fl-top-bar [title]="'settings.title' | transloco" [back]="['/l', leagueId(), 'more']" />
    <main class="page">
      @if (current === null) {
        <p class="empty">{{ 'league.notFound' | transloco }}</p>
      } @else if (!current) {
        <div class="loader"><mat-spinner [diameter]="40" /></div>
      } @else {
        <h2 class="fl-kicker">{{ 'settings.general' | transloco }}</h2>
        <section class="card">
          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ 'leagues.name' | transloco }}</mat-label>
            <input
              matInput
              [ngModel]="name()"
              (ngModelChange)="name.set($event)"
              (blur)="saveName()"
              (keydown.enter)="saveName()"
              maxlength="60"
              autocomplete="off"
            />
          </mat-form-field>
        </section>

        <h2 class="fl-kicker">{{ 'settings.rankingGroup' | transloco }}</h2>
        <section class="card">
          <h3>{{ 'settings.minGames' | transloco }}</h3>
          <p class="hint">{{ 'settings.minGamesHint' | transloco }}</p>
          <mat-form-field appearance="outline">
            <mat-select
              [value]="current.minGames ?? 0"
              (selectionChange)="save({ minGames: $event.value })"
              [attr.aria-label]="'settings.minGames' | transloco"
            >
              @for (option of minGames; track option) {
                <mat-option [value]="option">{{
                  option
                    ? ('count.games' | transloco: { n: option })
                    : ('settings.everyone' | transloco)
                }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </section>

        <h2 class="fl-kicker">{{ 'settings.changes' | transloco }}</h2>
        <section class="card rows">
          <div class="row">
            <div>
              <h3>{{ 'settings.lock' | transloco }}</h3>
              <p class="hint">{{ 'settings.lockHint' | transloco }}</p>
            </div>
            <mat-slide-toggle
              [checked]="!!current.archived"
              (change)="save({ archived: $event.checked })"
              [attr.aria-label]="'settings.lock' | transloco"
            />
          </div>
          <button class="row danger" (click)="archiveOrDelete()">
            <div>
              <h3>{{ 'settings.archiveOrDelete' | transloco }}</h3>
              <p class="hint">{{ 'settings.archiveOrDeleteHint' | transloco }}</p>
            </div>
            <mat-icon aria-hidden="true">chevron_right</mat-icon>
          </button>
        </section>
      }
    </main>
  `,
  styles: `
    .full {
      width: 100%;
    }
    .card {
      margin-bottom: 18px;
      padding: 14px 16px 4px;
      border-radius: 16px;
      background: var(--fl-card);
    }
    .card.rows {
      padding: 0;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: 100%;
      padding: 14px 16px;
      border: 0;
      background: none;
      color: inherit;
      text-align: left;
      font: inherit;
    }
    .row > div {
      flex: 1;
      min-width: 0;
    }
    .row > mat-slide-toggle,
    .row > .mat-icon {
      flex: none;
    }
    .row + .row {
      border-top: 1px solid var(--fl-line);
    }
    button.row {
      cursor: pointer;
    }
    h2 {
      margin: 4px 0 6px;
    }
    h3 {
      margin: 0 0 4px;
      font: 700 1rem/1.3 var(--fl-display);
    }
    .hint {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--fl-ink-2);
    }
    .row .hint {
      margin: 0;
    }
    .danger h3 {
      color: var(--fl-loss);
    }
    .danger .mat-icon {
      color: var(--fl-ink-2);
    }
  `,
})
export class LeagueSettingsComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _notifier = inject(Notifier);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _transloco = inject(TranslocoService);
  private readonly _router = inject(Router);

  protected readonly minGames = MIN_GAMES;
  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));
  protected readonly name = signal('');

  constructor() {
    // Show the stored name until it is edited.
    effect(() => {
      const league = this.league();
      if (league) {
        this.name.set(league.name);
      }
    });
  }

  protected saveName(): void {
    const name = this.name().trim();
    if (name && name !== this.league()?.name) {
      this.save({ name });
    }
  }

  protected save(changes: Partial<League>): void {
    this._leagueService
      .update(this.leagueId(), changes)
      .catch((error) => this._notifier.error('error.league', error));
  }

  private readonly _dialog = inject(MatDialog);
  protected readonly gameCount = computed(
    () => this._gameService.leagueGames(this.leagueId())?.length ?? 0,
  );

  /** Archive or delete, as chosen in the dialog. */
  protected archiveOrDelete(): void {
    const league = this.league();
    if (!league) {
      return;
    }
    openLeagueDeleteDialog(this._dialog, {
      name: league.name,
      games: this.gameCount(),
      archived: !!league.archived,
    })
      .afterClosed()
      .subscribe((choice) => {
        if (choice && 'archive' in choice) {
          this.save({ archived: true });
        } else if (choice) {
          this._remove(choice.withGames);
        }
      });
  }

  private _remove(withGames: boolean): void {
    const id = this.leagueId();
    this._leagueService
      .remove(id, withGames)
      .catch((error) => this._notifier.error('error.league', error));
    this._leagueService.lastLeague = '';
    this._router.navigate(['/leagues']);
    this._snackBar
      .open(this._transloco.translate('settings.deleted'), this._transloco.translate('game.undo'), {
        duration: 8000,
      })
      .onAction()
      .subscribe(() =>
        this._leagueService
          .restore(id)
          .catch((error) => this._notifier.error('error.league', error)),
      );
  }
}
