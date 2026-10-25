import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';

import { teamPlayers, teamScore } from '../../game/game';
import { Kit } from '../../player/kit';
import { KitFigureComponent } from '../../player/kit-figure.component';
import { GameService } from '../../game/game.service';
import { PlayerService } from '../../player/player.service';
import { TopBarComponent } from '../../shared/top-bar.component';
import { crestOf, League } from '../league';
import { openLeagueNewDialog } from '../league-new-dialog.component';
import { LeagueService } from '../league.service';

/** At most this many leagues match a search. */
const SEARCH_LIMIT = 20;
/** Leagues suggested on a first visit, before any was opened here. */
const SUGGESTED = 5;

/**
 * The leagues (canvas P01 and round 4, before accounts): the ones opened on this device, a
 * search over all of them, a new one and the overall ranking (deleted ones are not listed:
 * owner, 19 Oct 2026; a deleted league's page still offers to restore it).
 */
@Component({
  selector: 'fl-leagues',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    KitFigureComponent,
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

  /** No league opened on this device yet: the page starts by saying what the app is. */
  /** Archived leagues in a list: folded apart below the active ones. */
  protected archivedCount(leagues: { archived?: boolean }[]): number {
    return leagues.filter((league) => league.archived).length;
  }

  /** The account's deleted leagues, for the quiet link to their page. */
  protected readonly deletedCount = computed(() => this._leagueService.deletedLeagues().length);

  protected readonly firstVisit = computed(() => !this._leagueService.recent().length);
  /** Two figures for the welcome. */
  protected readonly kits: Kit[] = [
    { pattern: 'halves', c1: 'yellow', c2: 'blue', num: 9 },
    { pattern: 'stripes', c1: 'white', c2: 'black', num: 10 },
  ];

  /** The account's leagues, each with its crest, games, last game and a game running in it. */
  private readonly _all = computed(() =>
    this._leagueService.leagues()?.map((league) => this._withGames(league)),
  );

  private _withGames(league: League) {
    const games = this._gameService.leagueGames(league.id);
    return {
      ...league,
      crest: crestOf(league.name),
      games: games?.filter((game) => game.end).length,
      lastGame: games?.[0]?.start,
      live: this._live(games?.find((game) => !game.end && !game.paused)),
    };
  }

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
      // By id: an open league from before is on this device without being the account's.
      .map((id) => this._leagueService.league(id))
      .filter((league): league is League => !!league && !league.deleted)
      .map((league) => this._withGames(league));
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
