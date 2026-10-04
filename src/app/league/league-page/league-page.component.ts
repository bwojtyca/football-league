import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameService } from '../../game/game.service';
import { rankPlayers } from '../../player/player';
import { PlayerService } from '../../player/player.service';
import { RankingComponent } from '../../player/ranking/ranking.component';
import { leagueTitles, titlesByPlayer } from '../../stats/titles';
import { TopBarComponent } from '../../shared/top-bar.component';
import { openAddPlayerDialog } from '../add-player-dialog.component';
import { TodayCardComponent } from '../today-card.component';
import { LeagueService } from '../league.service';

/** A league's home: today's games and the ranking. */
@Component({
  selector: 'fl-league-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
    RankingComponent,
    TodayCardComponent,
    TopBarComponent,
    TranslocoPipe,
  ],
  templateUrl: './league-page.component.html',
  styleUrl: './league-page.component.scss',
})
export class LeaguePageComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _dialog = inject(MatDialog);

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );

  /** `undefined` while loading, `null` when there is no such league. */
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));

  protected readonly ranking = computed(() => {
    const league = this.league();
    const games = this._gameService.leagueGames(this.leagueId());
    const ratings = this._gameService.ratings(this.leagueId());
    const all = this._playerService.players();
    if (!league || !games || !ratings || !all) {
      return undefined;
    }
    const members = new Set(league.players);
    return rankPlayers(
      all.filter((p) => members.has(p.id)),
      games,
      ratings,
    );
  });

  protected readonly games = computed(() => this._gameService.leagueGames(this.leagueId()) ?? []);

  /** Titles held now, shown next to the names. */
  protected readonly titles = computed(() => {
    const ratings = this._gameService.ratings(this.leagueId());
    return ratings
      ? titlesByPlayer(leagueTitles(this.games(), ratings, this.league()?.minGames ?? 0))
      : new Map();
  });

  protected readonly playerLink = (playerId: string) => ['/l', this.leagueId(), 'player', playerId];

  protected readonly canPlay = computed(() => (this.league()?.players.length ?? 0) >= 2);

  protected addPlayer(): void {
    openAddPlayerDialog(this._dialog, { leagueId: this.leagueId() });
  }
}
