import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';

import { GameService } from '../game/game.service';
import { PlayerService } from '../player/player.service';
import { TournamentService } from '../tournament/tournament.service';
import { tournamentWinners } from '../tournament/winners';
import { hoursAndMinutes } from './format';
import { finished, gameSeconds, totalGoals } from './stats';

/** The ended tournaments of a league side by side: games, time, goals and winners. */
@Component({
  selector: 'fl-tournaments-table',
  imports: [RouterLink, TranslocoDecimalPipe, TranslocoPipe],
  template: `
    @if (rows().length > 1) {
      <h2 class="fl-kicker">{{ 'tournamentStats.compare' | transloco }}</h2>
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{{ 'tournamentStats.tournament' | transloco }}</th>
              <th scope="col">{{ 'tournament.gamesShort' | transloco }}</th>
              <th scope="col">{{ 'leagueStats.time' | transloco }}</th>
              <th scope="col">{{ 'tournamentStats.goalsPerGame' | transloco }}</th>
              <th scope="col">{{ 'tournamentStats.winner' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
                <th scope="row">
                  <a [routerLink]="['/l', leagueId(), 't', row.id]">{{ row.name }}</a>
                  <small>{{ 'tournament.format.' + row.format | transloco }}</small>
                </th>
                <td>{{ row.games }}</td>
                <td>{{ 'leagueStats.hours' | transloco: hours(row.seconds) }}</td>
                <td>{{ row.goals | translocoDecimal: { maximumFractionDigits: 1 } }}</td>
                <td>{{ winners()[row.id] ?? '' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    h2 {
      margin: 24px 0 8px;
    }
    .scroll {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    th,
    td {
      padding: 6px 4px;
      border-bottom: 1px solid var(--fl-line);
      text-align: right;
      vertical-align: top;
      white-space: nowrap;
    }
    th:first-child,
    td:last-child {
      text-align: left;
      white-space: normal;
    }
    thead th {
      color: var(--fl-ink-2);
      font-weight: 600;
    }
    tbody th small {
      display: block;
      color: var(--fl-ink-2);
      font-weight: 400;
    }
  `,
})
export class TournamentsTableComponent {
  private readonly _gameService = inject(GameService);
  private readonly _tournamentService = inject(TournamentService);
  private readonly _playerService = inject(PlayerService);

  public readonly leagueId = input.required<string>();

  protected readonly hours = hoursAndMinutes;

  protected readonly rows = computed(() =>
    (this._tournamentService.leagueTournaments(this.leagueId()) ?? [])
      .filter((tournament) => tournament.end)
      .map((tournament) => {
        const games = this._gameService.tournamentGames(tournament.league, tournament.id) ?? [];
        const played = finished(games);
        return {
          id: tournament.id,
          tournament,
          games: played.length,
          name: tournament.name,
          format: tournament.format,
          seconds: played.reduce((sum, game) => sum + gameSeconds(game), 0),
          goals: played.length
            ? played.reduce((sum, game) => sum + totalGoals(game), 0) / played.length
            : 0,
          all: games,
        };
      }),
  );

  /** Winners' names by tournament id, worked out asynchronously (a cup needs its bracket). */
  protected readonly winners = signal<Record<string, string>>({});

  constructor() {
    effect((onCleanup) => {
      const rows = this.rows();
      let current = true;
      onCleanup(() => (current = false));
      Promise.all(
        rows.map(async (row) => {
          const winners = await tournamentWinners(row.tournament, row.all);
          const names = winners
            .map((players) =>
              players.map((id) => this._playerService.getPlayerName(id)).join(' & '),
            )
            .join(', ');
          return [row.id, names] as const;
        }),
      ).then((entries) => {
        if (current) {
          this.winners.set(Object.fromEntries(entries));
        }
      });
    });
  }
}
