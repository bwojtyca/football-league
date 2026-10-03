import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

/** The games of a league as a list or as statistics, each with an address of its own. */
@Component({
  selector: 'fl-games-switch',
  imports: [RouterLink, TranslocoPipe],
  template: `
    <nav class="fl-switch" [attr.aria-label]="'leagueStats.view' | transloco">
      <a
        [routerLink]="['/l', leagueId(), 'games']"
        [attr.aria-current]="current() === 'list' ? 'page' : null"
        >{{ 'leagueStats.list' | transloco }}</a
      >
      <a
        [routerLink]="['/l', leagueId(), 'stats']"
        [attr.aria-current]="current() === 'stats' ? 'page' : null"
        >{{ 'leagueStats.stats' | transloco }}</a
      >
    </nav>
  `,
  styles: `
    :host {
      display: block;
      margin: 0 0 12px;
    }
  `,
})
export class GamesSwitchComponent {
  public readonly leagueId = input.required<string>();
  public readonly current = input.required<'list' | 'stats'>();
}
