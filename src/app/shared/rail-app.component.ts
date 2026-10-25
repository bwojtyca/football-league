import { Component, input } from '@angular/core';

import { AccountComponent } from './account.component';
import { LanguageSwitchComponent } from './language-switch.component';

/**
 * The app's things at the foot of a wide screen's rail: who uses the app (the player and the
 * Google account) and the language (owner, 18 Oct 2026: a wide screen has no menu button).
 */
@Component({
  selector: 'fl-rail-app',
  imports: [AccountComponent, LanguageSwitchComponent],
  template: `
    <fl-account [compact]="true" [leagueId]="leagueId()" />
    <fl-language-switch />
  `,
  styles: `
    :host {
      display: grid;
      gap: 10px;
      margin-top: auto;
      padding-top: 16px;
    }
  `,
})
export class RailAppComponent {
  /** The league whose players to pick from (this page's, or the last one opened). */
  public readonly leagueId = input<string | null>(null);
}
