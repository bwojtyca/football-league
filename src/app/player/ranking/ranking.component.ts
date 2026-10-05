import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';

import { Game } from '../../game/game';
import { FormDotsComponent } from '../../shared/form-dots.component';
import { places } from '../../shared/places';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { RankedPlayer } from '../player';
import { PlayerService } from '../player.service';
import { PROVISIONAL_GAMES } from '../rating';
import { POTATO_DAY_GAMES, POTATO_POINTS, potatoRanking, potatoState } from '../potato';
import { duets } from '../records';
import { Title } from '../../stats/titles';

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

  protected readonly provisionalGames = PROVISIONAL_GAMES;
  /** Who is ranked, and (players) by what: Elo, win rate or potato points. */
  protected readonly view = signal<'players' | 'duets'>('players');
  protected readonly sortBy = signal<'elo' | 'winRate' | 'potato'>('elo');

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
