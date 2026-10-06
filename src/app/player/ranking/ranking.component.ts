import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';

import { Game, POSITIONS, Position, TEAM_COLORS } from '../../game/game';
import { FormDotsComponent } from '../../shared/form-dots.component';
import { places } from '../../shared/places';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { RankedPlayer } from '../player';
import { PlayerService } from '../player.service';
import { PROVISIONAL_GAMES } from '../rating';
import { POTATO_DAY_GAMES, POTATO_POINTS, potatoRanking, potatoState } from '../potato';
import { duets } from '../records';
import { Title, TITLE_GAMES } from '../../stats/titles';

/** Fewest games together for a pair to be ranked. */
const DUET_GAMES = 3;

/**
 * Players by Elo, win rate or potato points, or pairs by win rate. Players with fewer than
 * `minGames` games are listed apart, unranked. Equal numbers share a place.
 */
@Component({
  selector: 'fl-ranking',
  imports: [
    DecimalPipe,
    NgTemplateOutlet,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    AvatarComponent,
    FormDotsComponent,
    RatingChangeComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
})
export class RankingComponent {
  private readonly _playerService = inject(PlayerService);

  public readonly players = input.required<RankedPlayer[]>();
  /** Games the pairs are counted from. */
  public readonly games = input.required<Game[]>();
  /** Link to a player's profile. */
  public readonly playerLink = input.required<(playerId: string) => unknown[]>();
  public readonly minGames = input(0);
  /** Titles each player holds now, shown as icons next to their name. */
  public readonly titles = input<Map<string, Title[]>>(new Map());
  /** Shows this many ranked players first, then more on request (the overall ranking). */
  public readonly pageSize = input<number | null>(null);
  private readonly _pages = signal(1);

  /** The ranked players shown now. */
  protected readonly shown = computed(() => {
    const size = this.pageSize();
    return size ? this.ranked().slice(0, size * this._pages()) : this.ranked();
  });

  protected showMore(): void {
    this._pages.update((pages) => pages + 1);
  }

  protected readonly provisionalGames = PROVISIONAL_GAMES;
  protected readonly titleGames = TITLE_GAMES;
  /** What is ranked (players, pairs or potatoes), and players by what: Elo or win rate. */
  protected readonly view = signal<'players' | 'duets' | 'potato'>('players');
  protected readonly sortBy = signal<'elo' | 'winRate'>('elo');

  private readonly _threshold = computed(() => Math.max(1, this.minGames()));

  /** Players with enough games, best first. */
  protected readonly ranked = computed(() => {
    const ranked = this.players().filter((p) => p.games >= this._threshold());
    return this.sortBy() === 'elo'
      ? ranked
      : [...ranked].sort((a, b) => b.winRatio - a.winRatio || b.games - a.games);
  });

  /** Places of the ranked players, shared when the shown number is the same. */
  protected readonly rankedPlaces = computed(() =>
    places(this.ranked(), (a, b) =>
      this.sortBy() === 'elo'
        ? a.rating === b.rating
        : Math.round(a.winRatio) === Math.round(b.winRatio),
    ),
  );

  /** Players below the threshold, most games first. */
  protected readonly others = computed(() =>
    this.players()
      .filter((p) => p.games < this._threshold())
      .sort((a, b) => b.games - a.games),
  );

  /** The position each player mostly plays in 2 vs 2 games, when one clearly prevails. */
  protected readonly mainPosition = computed(() => {
    const counts = new Map<string, Record<Position, number>>();
    for (const game of this.games()) {
      for (const color of TEAM_COLORS) {
        const team = game.teams[color];
        if (!game.end || team.defence.player === team.offence.player) {
          continue;
        }
        for (const position of POSITIONS) {
          const count = counts.get(team[position].player) ?? { defence: 0, offence: 0 };
          count[position]++;
          counts.set(team[position].player, count);
        }
      }
    }
    const main = new Map<string, Position>();
    for (const [id, { defence, offence }] of counts) {
      if (defence !== offence) {
        main.set(id, defence > offence ? 'defence' : 'offence');
      }
    }
    return main;
  });

  protected readonly potatoPoints = POTATO_POINTS;
  protected readonly potatoDayGames = POTATO_DAY_GAMES;
  /** Days as the potato, the potatoes now marked. */
  protected readonly potatoes = computed(() =>
    potatoRanking(this.games()).map((row) => ({
      ...row,
      name: this._playerService.getPlayerName(row.player),
    })),
  );
  /** Today's points, worst first: who would be the potato if the day ended now. */
  protected readonly potatoToday = computed(() =>
    potatoState(this.games()).today.map((row) => ({
      ...row,
      name: this._playerService.getPlayerName(row.player),
    })),
  );

  protected readonly potatoPlaces = computed(() =>
    places(this.potatoes(), (a, b) => a.days === b.days),
  );

  protected readonly duetGames = computed(() => Math.max(DUET_GAMES, this.minGames()));
  protected readonly duets = computed(() =>
    duets(this.games(), this.duetGames()).map((duet) => ({
      ...duet,
      names: duet.players.map((id) => this._playerService.getPlayerName(id)),
    })),
  );
  protected readonly duetPlaces = computed(() =>
    places(this.duets(), (a, b) => Math.round(a.winRatio) === Math.round(b.winRatio)),
  );
}
