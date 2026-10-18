import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';

import { Game } from '../game/game';
import { leagueOf } from '../league/league';
import { PlayerService } from '../player/player.service';
import { durationText, hoursAndMinutes, scoreOf, sidesOf } from './format';
import { tournamentSummary } from './stats';

/** A tournament in numbers: its best players and its records. */
@Component({
  selector: 'fl-tournament-summary',
  imports: [NgTemplateOutlet, RouterLink, TranslocoDecimalPipe, TranslocoPipe],
  template: `
    @if (summary(); as s) {
      <div class="fl-stats">
        <section>
          <h2>{{ 'tournamentStats.title' | transloco }}</h2>
          <div class="fl-tiles fl-tiles--three">
            <div>
              <b>{{ s.games }}</b>
              <small>{{ 'leagueStats.games' | transloco }}</small>
            </div>
            <div>
              <b>{{ 'leagueStats.hours' | transloco: hours(s.seconds) }}</b>
              <small>{{ 'leagueStats.time' | transloco }}</small>
            </div>
            <div>
              <b>{{ s.goals / s.games | translocoDecimal: { maximumFractionDigits: 1 } }}</b>
              <small>{{ 'tournamentStats.goalsPerGame' | transloco }}</small>
            </div>
          </div>
          <dl class="fl-records">
            @if (s.scorers; as best) {
              <div>
                <dt>{{ 'tournamentStats.scorer' | transloco }}</dt>
                <dd>{{ best.goals }}</dd>
                <dd class="about">
                  <ng-container *ngTemplateOutlet="people; context: { $implicit: best.players }" />
                </dd>
              </div>
            }
            @if (s.mostWins; as best) {
              <div>
                <dt>{{ 'tournamentStats.mostWins' | transloco }}</dt>
                <dd>{{ best.wins }}</dd>
                <dd class="about">
                  <ng-container *ngTemplateOutlet="people; context: { $implicit: best.players }" />
                </dd>
              </div>
            }
            @if (s.defence; as best) {
              <div>
                <dt>{{ 'tournamentStats.defence' | transloco }}</dt>
                <!-- The number with its unit, as the "Wall" title (evaluation 14: "2" alone). -->
                <dd>
                  {{
                    'stats.perGame'
                      | transloco
                        : {
                            value:
                              (best.conceded
                              | translocoDecimal
                                : { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
                          }
                  }}
                </dd>
                <dd class="about">
                  <ng-container *ngTemplateOutlet="people; context: { $implicit: best.players }" />
                  · {{ 'tournamentStats.conceded' | transloco }}
                </dd>
              </div>
            }
            @if (s.longest; as record) {
              <div>
                <dt>{{ 'leagueStats.longest' | transloco }}</dt>
                <dd>{{ time(record.value) }}</dd>
                <dd class="about">
                  <a [routerLink]="['/game', record.game.id]">{{ sides(record.game) }}</a>
                </dd>
              </div>
            }
            @if (s.biggestWin; as record) {
              <div>
                <dt>{{ 'leagueStats.biggestWin' | transloco }}</dt>
                <dd class="fl-led">{{ score(record.game) }}</dd>
                <dd class="about">
                  <a [routerLink]="['/game', record.game.id]">{{ sides(record.game) }}</a>
                </dd>
              </div>
            }
          </dl>
        </section>
      </div>
    }

    <!-- Names are links to profiles, as in the league's statistics (evaluation 9). -->
    <ng-template #people let-players>
      @for (player of players; track player; let last = $last) {
        <a [routerLink]="['/l', leagueId(), 'player', player]">{{ name(player) }}</a
        >{{ last ? '' : ', ' }}
      }
    </ng-template>
  `,
})
export class TournamentSummaryComponent {
  private readonly _transloco = inject(TranslocoService);
  private readonly _playerService = inject(PlayerService);

  public readonly games = input.required<Game[]>();

  /** Nothing before the first finished game. */
  protected readonly summary = computed(() => {
    const summary = tournamentSummary(this.games());
    return summary.games ? summary : null;
  });

  protected name(playerId: string): string {
    return this._playerService.shortName(playerId);
  }

  /** The league of the tournament's games, for the profile links. */
  protected readonly leagueId = computed(() => leagueOf(this.games()[0] ?? {}));

  protected time(seconds: number): string {
    return durationText((key, params) => this._transloco.translate(key, params), seconds);
  }

  protected readonly hours = hoursAndMinutes;
  protected readonly score = scoreOf;

  protected sides(game: Game): string {
    return sidesOf(game, (id) => this._playerService.shortName(id));
  }
}
