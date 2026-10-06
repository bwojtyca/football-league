import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameService } from '../game/game.service';
import { PlayerService } from '../player/player.service';
import { TopBarComponent } from '../shared/top-bar.component';
import { TournamentsTableComponent } from '../stats/tournaments-table.component';
import { openTournamentNewDialog } from '../tournament/tournament-new-dialog/tournament-new-dialog.component';
import { TournamentService } from '../tournament/tournament.service';
import { tournamentWinners } from '../tournament/winners';
import { LeagueService } from './league.service';

/** A league's tournaments and series: running ones first. */
@Component({
  selector: 'fl-league-tournaments',
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    TopBarComponent,
    TournamentsTableComponent,
    TranslocoPipe,
  ],
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
      @for (group of groups(); track group.key) {
        <h2 class="fl-kicker">{{ group.title | transloco }}</h2>
        <ul class="tournaments">
          @for (tournament of group.items; track tournament.id) {
            <li>
              <a
                [routerLink]="['/l', leagueId(), 't', tournament.id]"
                class="tournament"
                [class.running]="!tournament.end"
              >
                @if (!tournament.end) {
                  <span class="tag">{{ 'tournament.runningList' | transloco }}</span>
                }
                <span class="name">{{ tournament.name }}</span>
                <span class="meta">
                  {{ 'tournament.format.' + tournament.format | transloco }} ·
                  {{ 'count.games' | transloco: { n: tournament.games } }}
                </span>
                @if (tournament.end && winners()[tournament.id]; as names) {
                  <span class="winners">
                    <mat-icon aria-hidden="true">emoji_events</mat-icon>{{ names }}
                  </span>
                }
                <mat-icon class="go" aria-hidden="true">chevron_right</mat-icon>
              </a>
            </li>
          }
        </ul>
      } @empty {
        <ul class="tournaments">
          <li class="empty">{{ 'tournament.none' | transloco }}</li>
        </ul>
      }
      <fl-tournaments-table [leagueId]="leagueId()" />
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
      border-radius: 16px;
      background: var(--fl-card);
      color: inherit;
      text-decoration: none;
    }
    .tag {
      justify-self: start;
      margin-bottom: 2px;
      padding: 2px 9px;
      border-radius: 999px;
      background: var(--fl-ball);
      color: var(--fl-on-ball);
      font: 800 0.72rem/1.3 var(--fl-display);
    }
    .name {
      font: 700 1.1rem/1.25 var(--fl-display);
    }
    .meta {
      grid-column: 1;
      color: var(--fl-ink-2);
      font-size: 0.85rem;
    }
    .tournament .go {
      grid-row: 1 / span 3;
      grid-column: 2;
      color: var(--fl-ink-2);
    }
    .winners {
      grid-column: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-weight: 600;
    }
    .winners mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      color: var(--fl-gold);
    }
    h2 {
      margin: 16px 0 8px;
    }
    .tag {
      margin-left: 6px;
      padding: 2px 8px;
      border-radius: 9px;
      background: var(--fl-ball);
      color: var(--fl-on-ball);
      font: 700 0.7rem/1.2 var(--fl-display);
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
  private readonly _playerService = inject(PlayerService);
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

  /** Running tournaments first, then the finished ones. */
  protected readonly groups = computed(() => {
    const all = this.tournaments() ?? [];
    return [
      { key: 'running', title: 'tournament.runningList', items: all.filter((t) => !t.end) },
      { key: 'finished', title: 'tournament.finishedList', items: all.filter((t) => t.end) },
    ].filter((group) => group.items.length);
  });

  /** Winners' names of the finished tournaments, worked out asynchronously (cups). */
  protected readonly winners = signal<Record<string, string>>({});

  constructor() {
    effect((onCleanup) => {
      const finished = (this.tournaments() ?? []).filter((t) => t.end);
      let current = true;
      onCleanup(() => (current = false));
      Promise.all(
        finished.map(async (tournament) => {
          const games = this._gameService.tournamentGames(this.leagueId(), tournament.id) ?? [];
          const winners = await tournamentWinners(tournament, games);
          const names = winners
            .map((players) =>
              players.map((id) => this._playerService.getPlayerName(id)).join(' & '),
            )
            .join(', ');
          return [tournament.id, names] as const;
        }),
      ).then((entries) => current && this.winners.set(Object.fromEntries(entries)));
    });
  }

  protected newTournament(): void {
    openTournamentNewDialog(this._dialog, { leagueId: this.leagueId() });
  }
}
