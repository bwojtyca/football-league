import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { GameListComponent } from '../../game/game-list/game-list.component';
import {
  Game,
  Lineup,
  lineupOf,
  lineupPlayers,
  modeName,
  TeamColor,
  teamScore,
} from '../../game/game';
import { GameService } from '../../game/game.service';
import { LeagueService } from '../../league/league.service';
import { Notifier } from '../../notifier';
import { AvatarComponent } from '../../player/avatar/avatar.component';
import { compareNames } from '../../player/player';
import { PlayerService } from '../../player/player.service';
import { TopBarComponent } from '../../shared/top-bar.component';
import {
  drawRound,
  kingState,
  playerStandings,
  presentPlayers,
  roundRobinFixtures,
  seededRandom,
  teamStandings,
} from '../tournament';
import { TournamentService } from '../tournament.service';

@Component({
  selector: 'fl-tournament-page',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterLink,
    AvatarComponent,
    GameListComponent,
    TopBarComponent,
    TranslocoPipe,
  ],
  templateUrl: './tournament-page.component.html',
  styleUrl: './tournament-page.component.scss',
})
export class TournamentPageComponent {
  private readonly _tournamentService = inject(TournamentService);
  private readonly _gameService = inject(GameService);
  private readonly _leagueService = inject(LeagueService);
  private readonly _playerService = inject(PlayerService);
  private readonly _transloco = inject(TranslocoService);
  private readonly _notifier = inject(Notifier);
  private readonly _router = inject(Router);

  private readonly _params = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });
  protected readonly leagueId = computed(() => this._params().get('leagueId') ?? '');

  /** `undefined` while loading, `null` when there is no such tournament. */
  protected readonly tournament = computed(() =>
    this._tournamentService.tournament(this._params().get('tournamentId') ?? ''),
  );

  /** Games of the tournament, oldest first. */
  protected readonly games = computed(() => {
    const tournament = this.tournament();
    return tournament
      ? this._gameService.tournamentGames(tournament.league, tournament.id)
      : undefined;
  });

  protected readonly running = computed(() => this.games()?.find((game) => !game.end));

  protected readonly modeKey = computed(() => {
    const mode = this.tournament()?.mode;
    const name = mode && modeName(mode);
    return name ? `modes.${name}` : 'modes.custom';
  });

  protected readonly king = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    return tournament?.format === 'king' && games ? kingState(tournament, games) : null;
  });

  /** Players taking part (king of the table, draw your partner), by name. */
  protected readonly present = computed(() => {
    const tournament = this.tournament();
    return tournament
      ? [...presentPlayers(tournament.entries).keys()].sort((a, b) =>
          compareNames({ name: this.name(a) }, { name: this.name(b) }),
        )
      : [];
  });

  /** League players who could join. */
  protected readonly absent = computed(() => {
    const present = new Set(this.present());
    const members = this._leagueService.league(this.leagueId())?.players ?? [];
    return members
      .filter((player) => !present.has(player))
      .sort((a, b) => compareNames({ name: this.name(a) }, { name: this.name(b) }));
  });

  private readonly _seed = signal(Date.now());

  /** Draw your partner: the next game, drawn among the players not playing now. */
  protected readonly draw = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    if (tournament?.format !== 'dyp' || !games || this.running() || tournament.end) {
      return undefined;
    }
    const ratings = this._gameService.ratings(tournament.league)?.current ?? new Map();
    // The same draw stays on screen until a game is played or a new draw is asked for.
    const random = seededRandom(this._seed() + games.length);
    return drawRound([...presentPlayers(tournament.entries).keys()], games, ratings, random);
  });

  protected readonly standings = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    if (tournament?.format !== 'dyp' || !games) {
      return [];
    }
    const players = new Set([
      ...presentPlayers(tournament.entries).keys(),
      ...games.flatMap((game) => game.players),
    ]);
    return playerStandings([...players], games);
  });

  protected readonly fixtures = computed(() => {
    const tournament = this.tournament();
    const games = this.games();
    return tournament?.format === 'roundRobin' && games
      ? roundRobinFixtures(tournament, games)
      : [];
  });

  protected readonly table = computed(() => {
    const tournament = this.tournament();
    return tournament?.format === 'roundRobin' ? teamStandings(tournament, this.fixtures()) : [];
  });

  /** Winner shown once the tournament is over. */
  protected readonly winner = computed(() => {
    const tournament = this.tournament();
    if (!tournament?.end) {
      return null;
    }
    switch (tournament.format) {
      case 'king': {
        const record = this.king()?.record;
        return record ? this.lineupName(record.lineup) : null;
      }
      case 'dyp': {
        const best = this.standings()[0];
        return best?.games ? this.name(best.player) : null;
      }
      case 'roundRobin': {
        const best = this.table()[0];
        return best?.games ? this.lineupName(tournament.teams![best.team]) : null;
      }
    }
  });

  protected name(playerId: string): string {
    return this._playerService.getPlayerName(playerId);
  }

  protected lineupName(lineup: Lineup): string {
    return lineupPlayers(lineup)
      .map((player) => this.name(player))
      .join(' & ');
  }

  protected gameSide(game: Game, color: TeamColor): string {
    return this.lineupName(lineupOf(game.teams[color]));
  }

  protected score(game: Game): string {
    return `${teamScore(game, 'red')}:${teamScore(game, 'blue')}`;
  }

  protected teamName(index: number): string {
    const team = this.tournament()?.teams?.[index];
    return team ? this.lineupName(team) : '';
  }

  protected lineupPlayers = lineupPlayers;

  protected start(red: Lineup, blue: Lineup): void {
    const tournament = this.tournament();
    if (!tournament || tournament.end) {
      return;
    }
    const { id, saved } = this._gameService.createGame(
      tournament.league,
      red,
      blue,
      tournament.mode,
      {
        tournament: tournament.id,
      },
    );
    saved.catch((error) => this._notifier.error('error.newGame', error));
    this._router.navigate(['/game', id]);
  }

  protected redraw(): void {
    this._seed.update((seed) => seed + 1);
  }

  protected join(playerId: string): void {
    const tournament = this.tournament();
    if (tournament) {
      this._tournamentService
        .join(tournament.id, playerId)
        .catch((error) => this._notifier.error('error.tournament', error));
    }
  }

  protected leave(playerId: string): void {
    const tournament = this.tournament();
    if (tournament) {
      this._tournamentService
        .leave(tournament.id, playerId)
        .catch((error) => this._notifier.error('error.tournament', error));
    }
  }

  protected finish(): void {
    const tournament = this.tournament();
    if (tournament && confirm(this._transloco.translate('tournament.finishConfirm'))) {
      this._tournamentService
        .finish(tournament.id)
        .catch((error) => this._notifier.error('error.tournament', error));
    }
  }
}
