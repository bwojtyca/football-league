import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameListComponent } from '../../game/game-list/game-list.component';
import { openNewGameDialog } from '../../game/game-new/game-new-dialog/game-new-dialog.component';
import { GameService } from '../../game/game.service';
import { AvatarComponent } from '../../player/avatar/avatar.component';
import { rankPlayers } from '../../player/player';
import { PlayerService } from '../../player/player.service';
import { PROVISIONAL_GAMES } from '../../player/rating';
import { FormDotsComponent } from '../../shared/form-dots.component';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { TopBarComponent } from '../../shared/top-bar.component';
import { openTournamentNewDialog } from '../../tournament/tournament-new-dialog/tournament-new-dialog.component';
import { TournamentService } from '../../tournament/tournament.service';
import { openAddPlayerDialog } from '../add-player-dialog.component';
import { TodayCardComponent } from '../today-card.component';
import { LeagueService } from '../league.service';

type Tab = 'ranking' | 'games' | 'tournaments';

@Component({
  selector: 'fl-league-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
    AvatarComponent,
    FormDotsComponent,
    GameListComponent,
    RatingChangeComponent,
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
  private readonly _tournamentService = inject(TournamentService);

  protected readonly provisionalGames = PROVISIONAL_GAMES;
  protected readonly tab = signal<Tab>('ranking');

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

  protected readonly tournaments = computed(() =>
    this._tournamentService.leagueTournaments(this.leagueId())?.map((tournament) => ({
      ...tournament,
      games: this._gameService.tournamentGames(this.leagueId(), tournament.id)?.length ?? 0,
    })),
  );

  protected readonly canPlay = computed(() => (this.league()?.players.length ?? 0) >= 2);

  constructor() {
    effect(() => {
      if (this.league()) {
        this._leagueService.lastLeague = this.leagueId();
      }
    });
  }

  protected addPlayer(): void {
    openAddPlayerDialog(this._dialog, { leagueId: this.leagueId() });
  }

  protected newTournament(): void {
    openTournamentNewDialog(this._dialog, { leagueId: this.leagueId() });
  }

  protected newGame(): void {
    openNewGameDialog(this._dialog, { leagueId: this.leagueId() });
  }
}
