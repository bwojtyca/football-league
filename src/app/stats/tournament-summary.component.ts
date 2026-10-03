import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';

import { formatDuration, Game } from '../game/game';
import { PlayerService } from '../player/player.service';
import { hoursAndMinutes, scoreOf, sidesOf } from './format';
import { tournamentSummary } from './stats';

/** A tournament in numbers: its best players and its records. */
@Component({
  selector: 'fl-tournament-summary',
  imports: [RouterLink, TranslocoDecimalPipe, TranslocoPipe],
  template: `
    @if (summary(); as s) {
      <div class="fl-stats">
        <section>
          <h2>{{ 'tournamentStats.title' | transloco }}</h2>
          <div class="fl-tiles">
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
                <dd class="about">{{ names(best.players) }}</dd>
              </div>
            }
            @if (s.mostWins; as best) {
              <div>
                <dt>{{ 'tournamentStats.mostWins' | transloco }}</dt>
                <dd>{{ best.wins }}</dd>
                <dd class="about">{{ names(best.players) }}</dd>
              </div>
            }
            @if (s.defence; as best) {
              <div>
                <dt>{{ 'tournamentStats.defence' | transloco }}</dt>
                <dd>{{ best.conceded | translocoDecimal: { maximumFractionDigits: 1 } }}</dd>
                <dd class="about">
                  {{ names(best.players) }} · {{ 'tournamentStats.conceded' | transloco }}
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
                <dd>{{ score(record.game) }}</dd>
                <dd class="about">
                  <a [routerLink]="['/game', record.game.id]">{{ sides(record.game) }}</a>
                </dd>
              </div>
            }
          </dl>
        </section>
      </div>
    }
  `,
})
export class TournamentSummaryComponent {
  private readonly _playerService = inject(PlayerService);

  public readonly games = input.required<Game[]>();

  /** Nothing before the first finished game. */
  protected readonly summary = computed(() => {
    const summary = tournamentSummary(this.games());
    return summary.games ? summary : null;
  });

  protected names(players: string[]): string {
    return players.map((id) => this._playerService.getPlayerName(id)).join(', ');
  }

  protected time(seconds: number): string {
    return formatDuration(seconds);
  }

  protected readonly hours = hoursAndMinutes;
  protected readonly score = scoreOf;

  protected sides(game: Game): string {
    return sidesOf(game, (id) => this._playerService.getPlayerName(id));
  }
}
