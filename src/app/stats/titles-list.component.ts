import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { PlayerService } from '../player/player.service';
import { hoursAndMinutes } from './format';
import { Title, TITLE_GAMES } from './titles';

/** The titles of a league and who holds them now, with what earned them. */
@Component({
  selector: 'fl-titles-list',
  imports: [RouterLink, TranslocoPipe],
  template: `
    <dl class="fl-records">
      @for (row of rows(); track row.id) {
        <div>
          <dt>
            <span aria-hidden="true">{{ row.icon }}</span>
            {{ 'titles.' + row.id + '.name' | transloco }}
          </dt>
          <dd>
            @if (row.id === 'marathoner') {
              {{ 'leagueStats.hours' | transloco: hours(row.value) }}
            } @else {
              {{ 'titles.' + row.id + '.value' | transloco: { n: row.n, count: row.count } }}
            }
          </dd>
          <dd class="about">
            @for (player of row.players; track player; let last = $last) {
              <a [routerLink]="playerLink()(player)">{{ name(player) }}</a
              >{{ last ? '' : ', ' }}
            }
            · {{ 'titles.' + row.id + '.hint' | transloco: { n: games } }}
          </dd>
        </div>
      }
    </dl>
  `,
})
export class TitlesListComponent {
  private readonly _playerService = inject(PlayerService);
  private readonly _transloco = inject(TranslocoService);

  public readonly titles = input.required<Title[]>();
  public readonly playerLink = input.required<(playerId: string) => unknown[]>();

  protected readonly games = TITLE_GAMES;

  protected readonly hours = hoursAndMinutes;

  /** Each title with its value as text (`n`, e.g. "2,4") and as a whole number for plurals. */
  protected readonly rows = computed(() => {
    const locale = this._transloco.activeLang() === 'pl' ? 'pl-PL' : 'en-GB';
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    return this.titles().map((title) => ({
      ...title,
      n: number.format(title.id === 'leader' ? Math.round(title.value) : title.value),
      count: Math.round(title.value),
    }));
  });

  protected name(playerId: string): string {
    return this._playerService.getPlayerName(playerId);
  }
}
