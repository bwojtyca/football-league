import { Component, computed, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { LeagueService } from '../league/league.service';
import { inviteToLeague } from '../league/league-switcher.component';
import { openWhoSheet } from '../league/who-sheet.component';
import { PlayerService } from '../player/player.service';
import { InstallService } from './install.service';
import { LanguageSwitchComponent } from './language-switch.component';
import { MeService } from './me.service';
import { SheetCloseComponent } from './sheet-close.component';

/** The page's menu: inside a league, the league's invite and settings first, then the app's. */
export function openAppMenu(sheet: MatBottomSheet, leagueId: string | null = null) {
  return sheet.open(AppMenuSheetComponent, { data: { leagueId } });
}

/**
 * What belongs to the app, not to a league (canvas round 4): the language, installing it on
 * the phone, the overall ranking and the leagues. Opened from the top bar of every page.
 */
@Component({
  selector: 'fl-app-menu',
  imports: [SheetCloseComponent, MatIconModule, RouterLink, LanguageSwitchComponent, TranslocoPipe],
  template: `
    <h2>{{ 'appMenu.title' | transloco }}</h2>
    <!-- Inside a league, its invite and settings here too (evaluation 8: on a phone they were
         only behind the league's name). -->
    @if (leagueOfPage(); as league) {
      <h3 class="fl-kicker">{{ league.name }}</h3>
      <button class="row" (click)="invite(league)">
        <mat-icon aria-hidden="true">share</mat-icon>
        <span class="label">{{ 'switcher.invite' | transloco }}</span>
      </button>
      <a class="row" [routerLink]="['/l', league.id, 'settings']" (click)="close()">
        <mat-icon aria-hidden="true">settings</mat-icon>
        <span class="label">{{ 'settings.title' | transloco }}</span>
      </a>
      <h3 class="fl-kicker">{{ 'appMenu.app' | transloco }}</h3>
    }
    <div class="row">
      <mat-icon aria-hidden="true">language</mat-icon>
      <span class="label">{{ 'more.language' | transloco }}</span>
      <fl-language-switch />
    </div>
    @if (league; as leagueId) {
      <button class="row" (click)="who(leagueId)">
        <mat-icon aria-hidden="true">person_pin</mat-icon>
        <span class="label">
          @if (meName(); as name) {
            <b>{{ 'me.device' | transloco }}: {{ name }}</b>
          } @else {
            <b>{{ 'me.deviceNone' | transloco }}</b>
          }
        </span>
      </button>
    }
    @if (!install.installed()) {
      @if (install.canInstall()) {
        <button class="row" (click)="install.install()">
          <mat-icon aria-hidden="true" class="ball">install_mobile</mat-icon>
          <span class="label">
            <b>{{ 'appMenu.install' | transloco }}</b>
            <small>{{ 'appMenu.installHint' | transloco }}</small>
          </span>
        </button>
      } @else if (install.iosHint) {
        <div class="row">
          <mat-icon aria-hidden="true" class="ball">install_mobile</mat-icon>
          <span class="label">
            <b>{{ 'appMenu.install' | transloco }}</b>
            <small>{{ 'appMenu.installIos' | transloco }}</small>
          </span>
        </div>
      }
    }
    <a class="row" routerLink="/ranking" (click)="close()">
      <mat-icon aria-hidden="true">leaderboard</mat-icon>
      <span class="label">{{ 'ranking.global' | transloco }}</span>
    </a>
    <fl-sheet-close />
  `,
  styles: `
    :host {
      display: block;
      padding: 4px 4px 12px;
    }
    h2 {
      margin: 0 0 6px;
      font: var(--fl-sheet-title);
    }
    h3 {
      margin: 12px 0 2px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      min-height: 56px;
      padding: 4px 0;
      border: 0;
      background: none;
      color: var(--fl-ink);
      text-align: left;
      text-decoration: none;
      font: 700 1rem/1.25 var(--fl-display);
      cursor: pointer;
    }
    .row + .row {
      border-top: 1px solid var(--fl-line);
    }
    .row .mat-icon {
      flex: none;
      color: var(--fl-ink-2);
    }
    .row .mat-icon.ball {
      color: var(--fl-ink);
    }
    .label {
      flex: 1;
      display: grid;
      min-width: 0;
    }
    .label small {
      font: 400 0.875rem/1.3 var(--fl-display);
      color: var(--fl-ink-2);
    }
  `,
})
export class AppMenuSheetComponent {
  private readonly _ref = inject(MatBottomSheetRef<AppMenuSheetComponent>);
  protected readonly install = inject(InstallService);
  private readonly _sheet = inject(MatBottomSheet);
  private readonly _me = inject(MeService);
  private readonly _players = inject(PlayerService);

  private readonly _leagues = inject(LeagueService);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _transloco = inject(TranslocoService);
  private readonly _data = inject<{ leagueId: string | null } | null>(MAT_BOTTOM_SHEET_DATA, {
    optional: true,
  });
  /** The league last opened on this device: whose players to choose from. */
  protected readonly league = this._leagues.lastLeague;
  /** The league whose page opened the menu. */
  protected readonly leagueOfPage = computed(() => {
    const id = this._data?.leagueId;
    const league = id ? this._leagues.league(id) : null;
    return league ? { id: league.id, name: league.name } : null;
  });

  protected invite(league: { id: string; name: string }): void {
    void inviteToLeague(league, () =>
      this._snackBar.open(this._transloco.translate('hub.copied'), undefined, { duration: 2500 }),
    );
  }
  protected readonly meName = computed(() => {
    const id = this._me.id();
    return id ? this._players.getPlayerName(id) : null;
  });

  protected who(leagueId: string): void {
    openWhoSheet(this._sheet, { leagueId });
  }

  protected close(): void {
    this._ref.dismiss();
  }
}
