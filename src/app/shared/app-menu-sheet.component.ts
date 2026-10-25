import { Component, inject } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { LeagueService } from '../league/league.service';
import { InstallService } from './install.service';
import { LanguageSwitchComponent } from './language-switch.component';
import { SheetCloseComponent } from './sheet-close.component';
import { AccountComponent } from './account.component';

/** The app's menu (a phone's or tablet's; a wide screen has these in its rail). */
export function openAppMenu(sheet: MatBottomSheet) {
  return sheet.open(AppMenuSheetComponent);
}

/**
 * What belongs to the app, not to a league (canvas round 4): the language, installing it on
 * the phone, the overall ranking and the leagues. Opened from the top bar of every page.
 */
@Component({
  selector: 'fl-app-menu',
  imports: [
    AccountComponent,
    SheetCloseComponent,
    MatIconModule,
    RouterLink,
    LanguageSwitchComponent,
    TranslocoPipe,
  ],
  template: `
    <h2>{{ 'appMenu.title' | transloco }}</h2>
    <!-- The app's things only; a league's invite and settings are under its name (owner,
         18 Oct 2026). -->
    <div class="row">
      <mat-icon aria-hidden="true">language</mat-icon>
      <span class="label">{{ 'more.language' | transloco }}</span>
      <fl-language-switch />
    </div>
    <fl-account [leagueId]="league" />
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
      padding: 4px 0 12px;
    }
    h2 {
      margin: 0 0 6px;
      font: var(--fl-sheet-title);
    }
    h3 {
      margin: 12px 0 2px;
    }
    /* Rows as in the league's sheet: the icon in a 40 px slot, one left edge for every sheet's
       text (evaluation 17). */
    .row {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 12px;
      box-sizing: border-box;
      width: 100%;
      min-height: 56px;
      padding: 4px;
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
      justify-self: center;
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

  private readonly _leagues = inject(LeagueService);
  /** The league last opened on this device: whose players to choose from. */
  protected readonly league = this._leagues.lastLeague;
  protected close(): void {
    this._ref.dismiss();
  }
}
