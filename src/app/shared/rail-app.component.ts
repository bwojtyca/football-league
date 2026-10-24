import { Component, computed, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { openWhoSheet } from '../league/who-sheet.component';
import { PlayerService } from '../player/player.service';
import { LanguageSwitchComponent } from './language-switch.component';
import { MeService } from './me.service';
import { AccountComponent } from './account.component';

/**
 * The app's things at the foot of a wide screen's rail: who uses this device and the language
 * (owner, 18 Oct 2026: a wide screen has no menu button; these were only in it).
 */
@Component({
  selector: 'fl-rail-app',
  imports: [AccountComponent, MatIconModule, LanguageSwitchComponent, TranslocoPipe],
  template: `
    @if (leagueId(); as leagueId) {
      <button class="who" (click)="who(leagueId)">
        <mat-icon aria-hidden="true">person_pin</mat-icon>
        <span>
          @if (meName(); as name) {
            {{ 'me.device' | transloco }}: {{ name }}
          } @else {
            {{ 'me.deviceNone' | transloco }}
          }
        </span>
      </button>
    }
    <fl-account />
    <fl-language-switch />
  `,
  styles: `
    :host {
      display: grid;
      gap: 10px;
      margin-top: auto;
      padding-top: 16px;
    }
    .who {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      padding: 0 12px;
      border: 0;
      border-radius: 12px;
      background: none;
      color: var(--fl-ink-2);
      text-align: left;
      font: 600 0.9375rem/1.25 var(--fl-display);
      cursor: pointer;
    }
    .who mat-icon {
      flex: none;
    }
    .who span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .who:hover {
      background: var(--fl-card);
    }
  `,
})
export class RailAppComponent {
  private readonly _sheet = inject(MatBottomSheet);
  private readonly _me = inject(MeService);
  private readonly _players = inject(PlayerService);

  /** The league whose players to choose from (this page's, or the last one opened). */
  public readonly leagueId = input<string | null>(null);

  protected readonly meName = computed(() => {
    const id = this._me.id();
    return id ? this._players.shortName(id) : null;
  });

  protected who(leagueId: string): void {
    openWhoSheet(this._sheet, { leagueId });
  }
}
