import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDecimalPipe } from '@jsverse/transloco-locale';

import { PlayerService } from '../../player/player.service';
import { compareLink } from '../../stats/compare-link';
import { hoursAndMinutes } from '../../stats/format';
import { LinesComponent } from '../../stats/lines.component';
import { goalMoments, lineStats, modeRecords, playerTime } from '../../stats/stats';
import { ThirdsComponent } from '../../stats/thirds.component';
import { TournamentService } from '../../tournament/tournament.service';
import { tournamentWinners } from '../../tournament/winners';
import { formatDuration } from '../game';
import { GameService } from '../game.service';
import { ModeLabelComponent } from '../mode/mode-label.component';
import { calculateStats, ratio } from './player-stats';

@Component({
  selector: 'fl-games-stats',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    LinesComponent,
    ModeLabelComponent,
    ThirdsComponent,
    TranslocoDecimalPipe,
    TranslocoPipe,
  ],
  templateUrl: './games-stats.component.html',
  styleUrl: './games-stats.component.scss',
})
export class GamesStatsComponent {
  private readonly _gameService = inject(GameService);
  private readonly _tournamentService = inject(TournamentService);
  protected readonly playerService = inject(PlayerService);

  public readonly leagueId = input.required<string>();
  public readonly playerId = input.required<string>();

  private readonly _games = computed(() =>
    this._gameService.playerGames(this.leagueId(), this.playerId()),
  );

  protected readonly stats = computed(() => {
    const games = this._games();
    return games && calculateStats(games, this.playerId());
  });

  protected readonly time = computed(() => playerTime(this._games() ?? [], this.playerId()));
  protected readonly modes = computed(() => modeRecords(this._games() ?? [], this.playerId()));
  protected readonly moments = computed(() => goalMoments(this._games() ?? [], this.playerId()));
  protected readonly lines = computed(() => lineStats(this._games() ?? [], this.playerId()));

  /** Tournaments the player played a game in, and those they won (worked out asynchronously). */
  protected readonly tournaments = signal<{ played: number; won: number } | null>(null);

  constructor() {
    effect((onCleanup) => {
      const playerId = this.playerId();
      const played = new Set((this._games() ?? []).flatMap((game) => game.tournament ?? []));
      const tournaments = (this._tournamentService.leagueTournaments(this.leagueId()) ?? []).filter(
        (tournament) => played.has(tournament.id),
      );
      let current = true;
      onCleanup(() => (current = false));
      Promise.all(
        tournaments.map(async (tournament) => {
          const games = this._gameService.tournamentGames(tournament.league, tournament.id) ?? [];
          const winners = tournament.end ? await tournamentWinners(tournament, games) : [];
          return winners.some((players) => players.includes(playerId));
        }),
      ).then((won) => {
        if (current) {
          this.tournaments.set({ played: won.length, won: won.filter(Boolean).length });
        }
      });
    });
  }

  protected readonly ratio = ratio;

  protected percent(part: number, total: number): number {
    return ratio(part, total) * 100;
  }

  protected duration(seconds: number, count: number): string {
    return count ? formatDuration(seconds / count) : '–';
  }

  protected readonly hours = hoursAndMinutes;

  protected compare(rival: string): string[] {
    return compareLink(this.leagueId(), this.playerId(), rival);
  }
}
