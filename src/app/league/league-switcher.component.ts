import { Component, computed, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { GameService } from '../game/game.service';
import { crestOf } from './league';
import { LeagueService } from './league.service';
import { SheetCloseComponent } from '../shared/sheet-close.component';
import { openInviteDialog } from './invite-dialog.component';

export function openLeagueSwitcher(sheet: MatBottomSheet, currentLeague: string | null) {
  return sheet.open(LeagueSwitcherComponent, { data: currentLeague });
}

/**
 * The league menu, opened from the league's name (canvas R6-menu-ligi): the league at a glance,
 * inviting by its link, and the leagues of this device to switch to (its settings are behind
 * the gear).
 */
@Component({
  selector: 'fl-league-switcher',
  imports: [SheetCloseComponent, MatIconModule, RouterLink, TranslocoPipe],
  template: `
    @if (league(); as league) {
      <header class="head">
        <span class="crest" aria-hidden="true">{{ crest() }}</span>
        <span class="about">
          <b>{{ league.name }}</b>
          <small>
            {{ 'count.players' | transloco: { n: league.players.length } }}
            @if (league.games !== undefined) {
              · {{ 'count.games' | transloco: { n: league.games } }}
            }
          </small>
        </span>
      </header>
      <div class="actions">
        <button class="action" (click)="share()">
          <mat-icon aria-hidden="true">share</mat-icon>
          <span class="name">{{ 'switcher.invite' | transloco }}</span>
        </button>
        <!-- Everything about the league in its own menu (evaluation 6: settings sat in the
             app menu, invite and switching here). -->
        <a class="action" [routerLink]="['/l', league.id, 'settings']" (click)="close()">
          <mat-icon aria-hidden="true">settings</mat-icon>
          <span class="name">{{ 'settings.title' | transloco }}</span>
        </a>
      </div>
    }
    @if (others().length) {
      <h2 class="fl-kicker">{{ 'switcher.change' | transloco }}</h2>
    }
    <nav>
      @for (league of others(); track league.id) {
        <a
          [routerLink]="['/l', league.id]"
          (click)="close()"
          class="item"
          [class.current]="league.id === current"
          [attr.aria-current]="league.id === current ? 'page' : null"
        >
          <!-- Each league with its crest, as in the rail (evaluation 5). -->
          <span class="crest small" aria-hidden="true">{{ crestFor(league.name) }}</span>
          <span class="name">{{ league.name }}</span>
          <small>
            {{ 'count.players' | transloco: { n: league.players.length } }}
            @if (league.games !== undefined) {
              · {{ 'count.games' | transloco: { n: league.games } }}
            }
          </small>
          @if (league.id === current) {
            <mat-icon aria-hidden="true">check</mat-icon>
          }
        </a>
      }
      <a routerLink="/leagues" (click)="close()" class="item link">
        <mat-icon aria-hidden="true" class="lead">list</mat-icon>
        <span class="name">{{ 'switcher.manage' | transloco }}</span>
      </a>
    </nav>
    <fl-sheet-close />
  `,
  styles: `
    :host {
      display: block;
      padding: 4px 0 8px;
    }
    h2 {
      margin: 16px 0 6px;
    }
    /* Room on the right for the close disc (evaluation 6: the counts ran under it). */
    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 56px 12px 0;
    }
    .crest {
      flex: none;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--fl-board);
      color: var(--fl-ink);
      font: 800 0.95rem/1 var(--fl-display);
    }
    .about {
      display: grid;
      min-width: 0;
    }
    /* The whole name here, the one place it has room (evaluation 12: its end tells leagues
       apart, and it was cut everywhere). */
    .about b {
      overflow-wrap: anywhere;
      text-wrap: balance;
      font: var(--fl-sheet-title);
    }
    .about small {
      color: var(--fl-ink-2);
    }
    /* Rows as in the page menu, which holds the same actions (evaluation 13: cards here, rows
       there). */
    .actions {
      display: grid;
      border-bottom: 1px solid var(--fl-line);
    }
    /* The icon in the same 40 px slot as the leagues' crests below: one left edge for the text
       (evaluation 17). */
    .action {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      align-items: center;
      column-gap: 12px;
      box-sizing: border-box;
      width: 100%;
      min-height: 56px;
      padding: 4px 4px;
      border: 0;
      background: none;
      color: var(--fl-ink);
      text-align: left;
      text-decoration: none;
      font: inherit;
      cursor: pointer;
    }
    .action + .action {
      border-top: 1px solid var(--fl-line);
    }
    .action mat-icon {
      justify-self: center;
      color: var(--fl-ink-2);
    }
    .action .name {
      display: grid;
      font: 700 1rem/1.3 var(--fl-display);
    }
    .action small {
      font: 400 0.875rem/1.3 var(--fl-display);
      color: var(--fl-ink-2);
    }
    nav {
      display: grid;
    }
    .item {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 12px;
      min-height: 56px;
      padding: 6px 4px;
      border-bottom: 1px solid var(--fl-line);
      color: inherit;
      text-decoration: none;
    }
    .name {
      font: 700 1.1rem/1.25 var(--fl-display);
    }
    .crest.small {
      grid-row: 1 / span 2;
      grid-column: 1;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    /* Only the list's rows: the header's counts stay under its name (evaluation 6: a global
       rule put them beside it, "Biuro 20267 graczy"). */
    .item .name,
    .item small {
      grid-column: 2;
    }
    .item small {
      color: var(--fl-ink-2);
    }
    .item mat-icon {
      grid-row: 1 / span 2;
      grid-column: 3;
    }
    .item mat-icon.lead {
      grid-column: 1;
      justify-self: center;
    }
    .current {
      background: var(--fl-card-2);
      padding-left: 14px;
    }
    .link {
      grid-template-columns: 40px minmax(0, 1fr);
    }
    .link mat-icon {
      grid-column: 1;
      grid-row: 1;
      justify-self: center;
      color: var(--fl-ink-2);
    }
    .link .name {
      font-style: normal;
      font-size: 1.05rem;
    }
  `,
})
export class LeagueSwitcherComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _ref = inject(MatBottomSheetRef<LeagueSwitcherComponent>);


  protected readonly current = inject<string | null>(MAT_BOTTOM_SHEET_DATA);

  /** The leagues to switch to: the current one is at the top already. */
  protected readonly others = computed(() =>
    this.leagues().filter((league) => league.id !== this.current),
  );

  /** The current league with its number of games, when the menu is opened from one. */
  protected readonly league = computed(() => this.leagues().find((l) => l.id === this.current));
  protected readonly crest = computed(() => crestOf(this.league()?.name ?? ''));
  protected readonly crestFor = crestOf;
  private readonly _dialog = inject(MatDialog);

  /** Invites with a link and its QR code (a new invitation code each time). */
  protected share(): void {
    const league = this.league();
    if (league) {
      this.close();
      openInviteDialog(this._dialog, { league: { id: league.id, name: league.name } });
    }
  }

  /**
   * The leagues opened on this device, the current one included (with thousands of leagues,
   * never all of them: the rest is one search away on the leagues page).
   */
  protected readonly leagues = computed(() => {
    const ids = [
      ...new Set([...(this.current ? [this.current] : []), ...this._leagueService.recent()]),
    ];
    return (
      ids
        .map((id) => this._leagueService.league(id))
        // Deleted leagues live on their own page, not among the active ones (owner, 25 Oct 2026).
        .filter(
          (league): league is NonNullable<typeof league> =>
            !!league && (!league.deleted || league.id === this.current),
        )
        // Finished games, as the statistics count them.
        .map((league) => ({
          ...league,
          games: this._gameService.leagueGames(league.id)?.filter((game) => game.end).length,
        }))
    );
  });

  protected close(): void {
    this._ref.dismiss();
  }
}
