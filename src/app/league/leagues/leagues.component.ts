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

/** At most this many leagues match a search. */
const SEARCH_LIMIT = 20;
/** Leagues suggested on a first visit, before any was opened here. */
const SUGGESTED = 5;

/**
 * The leagues (canvas P01 and round 4, before accounts): the ones opened on this device, a
 * search over all of them, a new one, the overall ranking and the deleted ones.
 */
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
export class LeaguesComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _playerService = inject(PlayerService);
  private readonly _dialog = inject(MatDialog);

  /** What was typed in the search. */
  protected readonly query = signal('');

  /** Every league with its crest, games, last game and a game running in it. */
  private readonly _all = computed(() =>
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

  /**
   * The leagues shown: those matching the search, or the ones opened on this device (with
   * thousands of leagues, never all of them); on a first visit the most recently played.
   */
  protected readonly leagues = computed(() => {
    const all = this._all();
    if (!all) {
      return undefined;
    }
    const query = this.query().trim().toLowerCase();
    if (query) {
      return all
        .filter((league) =>
          league.name
            .toLowerCase()
            .split(/\s+/)
            .concat(league.name.toLowerCase())
            .some((word) => word.startsWith(query)),
        )
        .slice(0, SEARCH_LIMIT);
    }
    const recent = this._leagueService
      .recent()
      .map((id) => all.find((league) => league.id === id))
      .filter((league): league is NonNullable<typeof league> => !!league);
    return recent.length
      ? recent
      : [...all]
          .filter((league) => league.lastGame)
          .sort((a, b) => (a.lastGame! < b.lastGame! ? 1 : -1))
          .slice(0, SUGGESTED);
  });

  /** Which list is shown: search results, this device's leagues or suggestions. */
  protected readonly listKind = computed(() =>
    this.query().trim() ? 'found' : this._leagueService.recent().length ? 'recent' : 'active',
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
