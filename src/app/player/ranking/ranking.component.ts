import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Game } from '../../game/game';
import { FormDotsComponent } from '../../shared/form-dots.component';
import { RatingChangeComponent } from '../../shared/rating-change.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { RankedPlayer } from '../player';
import { PlayerService } from '../player.service';
import { PROVISIONAL_GAMES } from '../rating';
import { POTATO_MIN_GAMES, POTATO_POINTS, potatoRanking } from '../potato';
import { duets } from '../records';

/** Fewest games together for a pair to be ranked. */
const DUET_GAMES = 3;

/**
 * Players by Elo or by win rate, or pairs by win rate. Players with fewer than `minGames`
 * games are listed apart, unranked.
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

  protected readonly provisionalGames = PROVISIONAL_GAMES;
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

  /** Players below the threshold, most games first. */
  protected readonly others = computed(() =>
    this.players()
      .filter((p) => p.games < this._threshold())
      .sort((a, b) => b.games - a.games),
  );

  protected readonly potatoPoints = POTATO_POINTS;
  protected readonly potatoMinGames = POTATO_MIN_GAMES;
  protected readonly potatoes = computed(() =>
    potatoRanking(this.games()).map((row) => ({
      ...row,
      name: this._playerService.getPlayerName(row.player),
    })),
  );

  protected readonly duetGames = computed(() => Math.max(DUET_GAMES, this.minGames()));
  protected readonly duets = computed(() =>
    duets(this.games(), this.duetGames()).map((duet) => ({
      ...duet,
      names: duet.players.map((id) => this._playerService.getPlayerName(id)),
    })),
  );
}
