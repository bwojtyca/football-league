import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';

import { teamPlayers, teamScore } from '../../game/game';
import { GameService } from '../../game/game.service';
import { PlayerService } from '../../player/player.service';
import { TopBarComponent } from '../../shared/top-bar.component';
import { crestOf } from '../league-hub.component';
import { openLeagueNewDialog } from '../league-new-dialog.component';
import { League } from '../league';
import { LeagueService } from '../league.service';

@Component({
  selector: 'fl-leagues',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    TopBarComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  templateUrl: './leagues.component.html',
  styleUrl: './leagues.component.scss',
})
/** The leagues (canvas P01, before accounts): a game running in one, new and deleted ones. */
export class LeaguesComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _dialog = inject(MatDialog);

  protected readonly leagues = computed(() =>
    this._leagueService.leagues()?.map((league) => {
      const games = this._gameService.leagueGames(league.id);
      return {
        ...league,
        crest: crestOf(league.name),
        games: games?.length,
        lastGame: games?.[0]?.start,
        live: this._live(games?.find((game) => !game.end && !game.paused)),
      };
    }),
  );

  protected readonly onlyArchive = computed(() =>
    this.leagues()?.every((league) => league.archived),
  );

  /** Deleted leagues, to be found and restored. */
  protected readonly deleted = computed(() =>
    this._leagueService.deletedLeagues().map((league: League) => ({
      ...league,
      crest: crestOf(league.name),
    })),
  );
  protected readonly showDeleted = signal(false);

  protected newLeague(): void {
    openLeagueNewDialog(this._dialog);
  }

  /** A game running in a league: who plays and the score. */
  private _live(game: Parameters<typeof teamScore>[0] | undefined) {
    if (!game) {
      return null;
    }
    const names = (color: 'red' | 'blue') =>
      teamPlayers(game.teams[color])
        .map((id) => this._playerService.getPlayerName(id))
        .join(' & ');
    return {
      red: names('red'),
      blue: names('blue'),
      score: `${teamScore(game, 'red')}:${teamScore(game, 'blue')}`,
    };
  }
}
