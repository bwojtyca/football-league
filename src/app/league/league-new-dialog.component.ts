import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Notifier } from '../notifier';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { compareNames } from '../player/player';
import { PlayerService } from '../player/player.service';
import { crestOf } from './league-hub.component';
import { LeagueService } from './league.service';

export function openLeagueNewDialog(dialog: MatDialog) {
  return dialog.open(LeagueNewDialogComponent, {
    width: '560px',
    maxWidth: '100vw',
    panelClass: 'fl-full-on-phone',
  });
}

/**
 * A new league in two steps (canvas P02 and P71, before crests, rules and accounts): its name,
 * then who plays: players of other leagues and new ones.
 */
@Component({
  selector: 'fl-league-new-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    AvatarComponent,
    TranslocoPipe,
  ],
  template: `
    <header class="head">
      @if (step() === 2) {
        <button matIconButton (click)="step.set(1)" [attr.aria-label]="'common.back' | transloco">
          <mat-icon>arrow_back</mat-icon>
        </button>
      } @else {
        <button matIconButton mat-dialog-close [attr.aria-label]="'common.cancel' | transloco">
          <mat-icon>close</mat-icon>
        </button>
      }
      <h2 mat-dialog-title>
        {{ (step() === 1 ? 'leagues.new' : 'leagueNew.who') | transloco }}
        <small>{{ 'leagueNew.step' | transloco: { n: step(), of: 2 } }}</small>
      </h2>
    </header>

    <mat-dialog-content>
      @if (step() === 1) {
        <div class="crest-row">
          <span class="crest" aria-hidden="true">{{ crest() || '?' }}</span>
          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ 'leagues.name' | transloco }}</mat-label>
            <input
              matInput
              [ngModel]="name()"
              (ngModelChange)="name.set($event)"
              (keydown.enter)="next()"
              maxlength="60"
              autocomplete="off"
              cdkFocusInitial
            />
            <mat-hint>{{ 'leagues.nameHint' | transloco }}</mat-hint>
          </mat-form-field>
        </div>
      } @else {
        <label class="search">
          <mat-icon aria-hidden="true">search</mat-icon>
          <input
            type="search"
            autocomplete="off"
            [attr.aria-label]="'leagueNew.search' | transloco"
            [placeholder]="'leagueNew.search' | transloco"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </label>
        @if (others().length) {
          <h3 class="fl-kicker">
            {{ (query().trim() ? 'leagueNew.found' : 'leagueNew.fromOthers') | transloco }}
          </h3>
          <div class="players">
            @for (player of others(); track player.id) {
              <button
                class="player"
                [class.picked]="picked().has(player.id)"
                [attr.aria-pressed]="picked().has(player.id)"
                (click)="toggle(player.id)"
              >
                <fl-avatar [playerId]="player.id" [name]="player.name" [size]="28" />
                {{ player.name }}
              </button>
            }
          </div>
        }
        <h3 class="fl-kicker">{{ 'leagueNew.newPlayers' | transloco }}</h3>
        <div class="add">
          <mat-form-field appearance="outline" class="full">
            <mat-label>{{ 'addPlayer.name' | transloco }}</mat-label>
            <input
              matInput
              [ngModel]="newName()"
              (ngModelChange)="newName.set($event)"
              (keydown.enter)="addNew()"
              maxlength="50"
              autocomplete="off"
            />
          </mat-form-field>
          <button matButton="outlined" (click)="addNew()">{{ 'addPlayer.add' | transloco }}</button>
        </div>
        @if (newNames().length) {
          <div class="players">
            @for (name of newNames(); track name) {
              <button class="player picked" (click)="removeNew(name)">
                <mat-icon>close</mat-icon>{{ name }}
              </button>
            }
          </div>
        }
        <p class="hint">
          {{ 'leagueNew.summary' | transloco: { n: picked().size + newNames().length } }}
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions>
      @if (step() === 1) {
        <button matButton="filled" class="fl-cta wide" [disabled]="!name().trim()" (click)="next()">
          {{ 'leagueNew.next' | transloco }}
        </button>
      } @else {
        <button matButton="filled" class="fl-cta wide" (click)="create()">
          {{ 'leagues.create' | transloco }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .head {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 6px 8px 0 4px;
    }
    .head h2 {
      flex: 1;
      display: grid;
      margin: 0;
      padding: 0;
      font: 800 1.4rem/1.2 var(--fl-display);
    }
    .head h2::before {
      display: none;
    }
    .head small {
      font: 600 0.8rem/1.2 var(--fl-display);
      color: var(--fl-ink-2);
    }
    .crest-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding-top: 8px;
    }
    .crest {
      flex: none;
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: var(--fl-board);
      color: var(--fl-ball);
      font: 800 1.1rem/1 var(--fl-display);
    }
    .full {
      flex: 1;
      width: 100%;
    }
    h3 {
      margin: 12px 0 8px;
    }
    .players {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .player {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 14px 0 6px;
      border: 1.5px solid var(--fl-line-2);
      border-radius: 20px;
      background: transparent;
      color: var(--fl-ink);
      font: 600 0.9rem/1 var(--fl-display);
      cursor: pointer;
    }
    .player.picked {
      border-color: var(--fl-ink);
      background: var(--fl-ink);
      color: var(--fl-paper);
    }
    .player .mat-icon {
      width: 18px;
      height: 18px;
      margin-left: 6px;
      font-size: 18px;
    }
    .search {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 44px;
      margin-top: 4px;
      padding: 0 14px;
      border-radius: 22px;
      background: var(--fl-card-2);
    }
    .search .mat-icon {
      color: var(--fl-ink-2);
    }
    .search input {
      flex: 1;
      min-width: 0;
      border: 0;
      background: none;
      color: var(--fl-ink);
      font: 500 1rem var(--fl-display);
    }
    .search input:focus {
      outline: none;
    }
    .add {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .add button {
      margin-top: 8px;
    }
    .hint {
      color: var(--fl-ink-2);
      font-size: 0.85rem;
    }
    mat-dialog-actions {
      padding: 10px 24px calc(16px + env(safe-area-inset-bottom, 0px));
    }
    .wide {
      width: 100%;
      --mat-button-filled-container-height: 54px;
      font-size: 1.05rem;
    }
  `,
})
export class LeagueNewDialogComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _playerService = inject(PlayerService);
  private readonly _notifier = inject(Notifier);
  private readonly _router = inject(Router);
  private readonly _ref = inject(MatDialogRef<LeagueNewDialogComponent>);

  protected readonly step = signal<1 | 2>(1);
  protected readonly name = signal('');
  protected readonly crest = computed(() => crestOf(this.name()));

  protected readonly query = signal('');

  /**
   * Players to pick: those of the leagues opened on this device, or (with thousands of players,
   * never all of them) those found by name; the ones already picked stay listed.
   */
  protected readonly others = computed(() => {
    const players = this._playerService.players() ?? [];
    const query = this.query().trim().toLowerCase();
    if (query) {
      return players
        .filter((player) =>
          player.name
            .toLowerCase()
            .split(/\s+/)
            .concat(player.name.toLowerCase())
            .some((word) => word.startsWith(query)),
        )
        .sort(compareNames)
        .slice(0, 20);
    }
    const mine = new Set(
      this._leagueService
        .recent()
        .flatMap((id) => this._leagueService.league(id)?.players ?? [])
        .concat([...this.picked()]),
    );
    return players.filter((player) => mine.has(player.id)).sort(compareNames);
  });
  protected readonly picked = signal(new Set<string>());
  protected readonly newName = signal('');
  protected readonly newNames = signal<string[]>([]);

  protected next(): void {
    if (this.name().trim()) {
      this.step.set(2);
    }
  }

  protected toggle(id: string): void {
    const picked = new Set(this.picked());
    if (!picked.delete(id)) {
      picked.add(id);
    }
    this.picked.set(picked);
  }

  protected addNew(): void {
    const name = this.newName().trim();
    if (name && !this.newNames().includes(name)) {
      this.newNames.update((names) => [...names, name]);
    }
    this.newName.set('');
  }

  protected removeNew(name: string): void {
    this.newNames.update((names) => names.filter((other) => other !== name));
  }

  /** Creates the league, then adds its players one by one, and opens it. */
  protected create(): void {
    const name = this.name().trim();
    if (!name) {
      this.step.set(1);
      return;
    }
    this.addNew();
    const { id, saved } = this._leagueService.createLeague(name);
    const players = [
      ...this.picked(),
      ...this.newNames().map((player) => {
        const created = this._playerService.createPlayer(player);
        created.saved.catch((error) => this._notifier.error('error.addPlayer', error));
        return created.id;
      }),
    ];
    saved
      .then(async () => {
        for (const player of players) {
          await this._leagueService.addPlayer(id, player);
        }
      })
      .catch((error) => this._notifier.error('error.createLeague', error));
    this._ref.close(id);
    this._router.navigate(['/l', id]);
  }
}
