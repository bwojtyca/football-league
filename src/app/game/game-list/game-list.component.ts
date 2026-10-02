import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';

import { PlayerService } from '../../player/player.service';
import { TournamentService } from '../../tournament/tournament.service';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { Game, modeName, modeOf, Team, teamOf, teamPlayers, teamScore } from '../game';
import { GameService } from '../game.service';

/** Games of a league, or of one player in it, newest first. */
@Component({
  selector: 'fl-game-list',
  imports: [MatButtonModule, RouterLink, RatingChangeComponent, TranslocoDatePipe, TranslocoPipe],
  templateUrl: './game-list.component.html',
  styleUrl: './game-list.component.css',
})
export class GameListComponent {
  private readonly _playerService = inject(PlayerService);
  private readonly _gameService = inject(GameService);
  private readonly _tournamentService = inject(TournamentService);

  public readonly leagueId = input.required<string>();
  /** Shows only this player's games, from their side. */
  public readonly playerId = input<string | null>(null);
  /** Shows only the games of this tournament. */
  public readonly tournamentId = input<string | null>(null);
  public readonly pageSize = input(20);

  private readonly _pages = signal(1);

  private readonly _games = computed(() => {
    const playerId = this.playerId();
    const tournamentId = this.tournamentId();
    const games =
      (playerId
        ? this._gameService.playerGames(this.leagueId(), playerId)
        : this._gameService.leagueGames(this.leagueId())) ?? [];
    return tournamentId ? games.filter((game) => game.tournament === tournamentId) : games;
  });

  protected readonly more = computed(() => this._games().length > this._pages() * this.pageSize());

  protected readonly games = computed(() => {
    const playerId = this.playerId();
    const changes = this._gameService.ratings(this.leagueId())?.changes;
    return this._games()
      .slice(0, this._pages() * this.pageSize())
      .map((game) => ({
        id: game.id,
        result: this._result(game, playerId),
        start: game.start,
        red: this._names(game.teams.red, playerId),
        blue: this._names(game.teams.blue, playerId),
        redScore: teamScore(game, 'red'),
        blueScore: teamScore(game, 'blue'),
        win: game.win,
        change: playerId ? changes?.get(game.id)?.get(playerId) : undefined,
        mode: this._modeLabel(game),
        seriesGame: game.series?.game,
        tournament:
          game.tournament && !this.tournamentId()
            ? this._tournamentService.tournament(game.tournament)?.name
            : undefined,
      }));
  });

  /** Translation key of the mode, unless it is the usual game to 8. */
  private _modeLabel(game: Game): { key: string; target: number } | undefined {
    const mode = modeOf(game);
    const name = modeName(mode);
    if (name === 'to8') {
      return undefined;
    }
    return { key: name ? `modes.${name}` : 'modes.custom', target: mode.target };
  }

  protected showMore(): void {
    this._pages.update((pages) => pages + 1);
  }

  protected round(value: number): number {
    return Math.round(value);
  }

  private _names(team: Team, playerId: string | null) {
    return teamPlayers(team).map((id) => ({
      name: this._playerService.getPlayerName(id),
      current: id === playerId,
    }));
  }

  private _result(game: Game, playerId: string | null): 'in-progress' | 'win' | 'lost' | 'done' {
    if (!game.win) {
      return 'in-progress';
    }
    if (!playerId) {
      return 'done';
    }
    return teamOf(game, playerId) === game.win ? 'win' : 'lost';
  }
}
