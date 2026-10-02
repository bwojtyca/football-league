import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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

import { Notifier } from '../../notifier';
import { TopBarComponent } from '../../shared/top-bar.component';
import { League } from '../league';
import { LeagueService } from '../league.service';

/** Choices for the fewest games a player needs to be ranked. */
const MIN_GAMES = [0, 3, 5, 10, 20, 50];

/**
 * League settings. Without sign-in anyone may change them; a league moderator comes with
 * sign-in later.
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
    <fl-top-bar [title]="'settings.title' | transloco" [back]="'/l/' + leagueId()" />
    <main class="page">
      @if (current === null) {
        <p class="empty">{{ 'league.notFound' | transloco }}</p>
      } @else if (!current) {
        <div class="loader"><mat-spinner [diameter]="40" /></div>
      } @else {
        <section>
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

        <section class="row">
          <div>
            <h2>{{ 'settings.lock' | transloco }}</h2>
            <p class="hint">{{ 'settings.lockHint' | transloco }}</p>
          </div>
          <mat-slide-toggle
            [checked]="!!current.archived"
            (change)="save({ archived: $event.checked })"
            [attr.aria-label]="'settings.lock' | transloco"
          />
        </section>

        <section>
          <h2>{{ 'settings.minGames' | transloco }}</h2>
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

        <section class="danger">
          <h2>{{ 'settings.delete' | transloco }}</h2>
          <p class="hint">{{ 'settings.deleteHint' | transloco }}</p>
          <button matButton="outlined" (click)="remove()">
            <mat-icon>delete_outline</mat-icon>{{ 'settings.delete' | transloco }}
          </button>
        </section>
      }
    </main>
  `,
  styles: `
    section {
      margin-bottom: 20px;
    }
    .full {
      width: 100%;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    h2 {
      margin: 0 0 4px;
      font: 600 1rem/1.3 inherit;
    }
    .hint {
      margin: 0 0 8px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }
    .danger button {
      color: var(--mat-sys-error);
    }
  `,
})
export class LeagueSettingsComponent {
  private readonly _leagueService = inject(LeagueService);
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

  protected remove(): void {
    const id = this.leagueId();
    if (
      !confirm(this._transloco.translate('settings.deleteConfirm', { name: this.league()?.name }))
    ) {
      return;
    }
    this.save({ deleted: true });
    this._leagueService.lastLeague = '';
    this._router.navigate(['/leagues']);
    this._snackBar
      .open(this._transloco.translate('settings.deleted'), this._transloco.translate('game.undo'), {
        duration: 8000,
      })
      .onAction()
      .subscribe(() =>
        this._leagueService
          .update(id, { deleted: false })
          .catch((error) => this._notifier.error('error.league', error)),
      );
  }
}
