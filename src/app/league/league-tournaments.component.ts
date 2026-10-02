import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameService } from '../game/game.service';
import { TopBarComponent } from '../shared/top-bar.component';
import { openTournamentNewDialog } from '../tournament/tournament-new-dialog/tournament-new-dialog.component';
import { TournamentService } from '../tournament/tournament.service';
import { LeagueService } from './league.service';

/** A league's tournaments and series: running ones first. */
@Component({
  selector: 'fl-league-tournaments',
  imports: [MatButtonModule, MatIconModule, RouterLink, TopBarComponent, TranslocoPipe],
  template: `
    @let current = league();
    <fl-top-bar [title]="current?.name ?? ''" [switcher]="leagueId()" />
    <main class="page">
      @if (current && !current.archived) {
        <button
          matButton="outlined"
          class="new-tournament"
          (click)="newTournament()"
          [disabled]="current.players.length < 2"
        >
          <mat-icon>add</mat-icon>{{ 'tournament.new' | transloco }}
        </button>
      }
      <ul class="tournaments">
        @for (tournament of tournaments(); track tournament.id) {
          <li>
            <a
              [routerLink]="['/l', leagueId(), 't', tournament.id]"
              class="tournament"
              [class.running]="!tournament.end"
            >
              <span class="name">
                {{ tournament.name }}
                @if (!tournament.end) {
                  <em class="tag">{{ 'tournament.running' | transloco }}</em>
                }
              </span>
              <span class="meta">
                {{ 'tournament.format.' + tournament.format | transloco }} ·
                {{ 'count.games' | transloco: { n: tournament.games } }}
              </span>
              <mat-icon aria-hidden="true">chevron_right</mat-icon>
            </a>
          </li>
        } @empty {
          <li class="empty">{{ 'tournament.none' | transloco }}</li>
        }
      </ul>
    </main>
  `,
  styles: `
    .new-tournament {
      margin: 4px 0 12px;
    }
    .tournaments {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .tournament {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 8px;
      row-gap: 2px;
      padding: 12px 12px 12px 16px;
      border: 1px solid var(--fl-line);
      border-left: 4px solid var(--fl-line);
      border-radius: 12px;
      background: var(--fl-card);
      color: inherit;
      text-decoration: none;
    }
    .tournament.running {
      border-left-color: var(--fl-ball);
    }
    .name {
      font: italic 800 1.2rem/1.2 var(--fl-display);
      text-transform: uppercase;
    }
    .meta {
      grid-column: 1;
      color: var(--fl-ink-2);
      font-size: 0.85rem;
    }
    .tournament mat-icon {
      grid-row: 1 / span 2;
      grid-column: 2;
      color: var(--fl-ink-2);
    }
    .tag {
      margin-left: 6px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--fl-ball);
      color: var(--fl-on-ball);
      font: normal 700 0.7rem/1.2 var(--fl-display);
      letter-spacing: 0.06em;
      vertical-align: 3px;
    }
    .empty {
      color: var(--fl-ink-2);
    }
  `,
})
export class LeagueTournamentsComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _tournamentService = inject(TournamentService);
  private readonly _dialog = inject(MatDialog);

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));

  protected readonly tournaments = computed(() =>
    this._tournamentService.leagueTournaments(this.leagueId())?.map((tournament) => ({
      ...tournament,
      games: this._gameService.tournamentGames(this.leagueId(), tournament.id)?.length ?? 0,
    })),
  );

  protected newTournament(): void {
    openTournamentNewDialog(this._dialog, { leagueId: this.leagueId() });
  }
}
