import { Component, inject } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { InstallService } from './install.service';
import { LanguageSwitchComponent } from './language-switch.component';

export function openAppMenu(sheet: MatBottomSheet) {
  return sheet.open(AppMenuSheetComponent);
}

/**
 * What belongs to the app, not to a league (canvas round 4): the language, installing it on
 * the phone, the overall ranking and the leagues. Opened from the top bar of every page.
 */
@Component({
  selector: 'fl-app-menu',
  imports: [MatIconModule, RouterLink, LanguageSwitchComponent, TranslocoPipe],
  template: `
    <h2>{{ 'appMenu.title' | transloco }}</h2>
    <div class="row">
      <mat-icon aria-hidden="true">language</mat-icon>
      <span class="label">{{ 'more.language' | transloco }}</span>
      <fl-language-switch />
    </div>
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
    <a class="row" routerLink="/leagues" (click)="close()">
      <mat-icon aria-hidden="true">list</mat-icon>
      <span class="label">{{ 'appMenu.leagues' | transloco }}</span>
    </a>
  `,
  styles: `
    :host {
      display: block;
      padding: 4px 4px 12px;
    }
    h2 {
      margin: 0 0 6px;
      font: 800 1.3rem/1.2 var(--fl-display);
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
      color: var(--fl-ball);
    }
    .label {
      flex: 1;
      display: grid;
      min-width: 0;
    }
    .label small {
      font: 400 0.8rem/1.3 var(--fl-display);
      color: var(--fl-ink-2);
    }
  `,
})
export class AppMenuSheetComponent {
  private readonly _ref = inject(MatBottomSheetRef<AppMenuSheetComponent>);
  protected readonly install = inject(InstallService);

  protected close(): void {
    this._ref.dismiss();
  }
}
