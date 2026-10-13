import { Component, computed, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Game, teamOf } from '../game/game';
import { AvatarComponent } from '../player/avatar/avatar.component';
import { RankedPlayer } from '../player/player';
import { MeService } from '../shared/me.service';
import { places } from '../shared/places';
import { RatingChangeComponent } from '../shared/rating-change.component';
import { openWhoSheet } from './who-sheet.component';

/**
 * The top of a league page for whoever uses this device (canvas R6-liga): their place, Elo and
 * today's games, one tap from their profile; before they say who they are, the question.
 */
@Component({
  selector: 'fl-you-card',
  imports: [MatIconModule, RouterLink, AvatarComponent, RatingChangeComponent, TranslocoPipe],
  template: `
    @if (you(); as you) {
      <a class="you" [routerLink]="['/l', leagueId(), 'player', you.id]">
        <fl-avatar [playerId]="you.id" [name]="you.name" [size]="48" />
        <span class="text">
          <small class="fl-kicker">{{ 'me.you' | transloco }} · {{ you.name }}</small>
          <b>
            @if (place(); as place) {
              {{ 'me.place' | transloco: { n: place } }} ·
            }
            @if (you.rating !== null) {
              <span class="led">{{ you.rating }}</span>
              @if (you.change !== null) {
                <fl-change [value]="you.change" />
              }
            } @else {
              {{ 'league.unrated' | transloco }}
            }
          </b>
          <small>
            @if (missing(); as n) {
              {{ 'me.missing' | transloco: { n } }}
            } @else if (today().games) {
              {{ 'me.today' | transloco: today() }}
            } @else {
              {{ 'me.profile' | transloco }}
            }
          </small>
        </span>
        <mat-icon aria-hidden="true">chevron_right</mat-icon>
      </a>
    } @else if (!me.id() && players().length) {
      <button class="ask" (click)="ask()">
        <mat-icon aria-hidden="true">person_pin</mat-icon>
        <span class="text">
          <b>{{ 'me.title' | transloco }}</b>
          <small>{{ 'me.askHint' | transloco }}</small>
        </span>
        <span class="pick">{{ 'me.pick' | transloco }}</span>
      </button>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    :host:empty {
      display: none;
    }
    .you,
    .ask {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 12px;
      padding: 12px;
      border: 0;
      border-radius: 16px;
      background: var(--fl-card-2);
      color: var(--fl-ink);
      text-align: left;
      text-decoration: none;
      font: inherit;
      cursor: pointer;
    }
    .text {
      flex: 1;
      min-width: 0;
      display: grid;
      gap: 2px;
      line-height: 1.3;
    }
    .text b {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 6px;
      font: 800 1.05rem/1.3 var(--fl-display);
    }
    .text small {
      color: var(--fl-ink-2);
      font-size: 0.85rem;
    }
    .text .fl-kicker {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.75rem;
    }
    .led {
      font: 800 1.2rem/1 var(--fl-display);
      font-variant-numeric: tabular-nums;
    }
    .you mat-icon {
      color: var(--fl-ink-2);
    }
    .ask mat-icon {
      flex: none;
      width: 32px;
      height: 32px;
      font-size: 32px;
      color: var(--fl-ball);
    }
    .pick {
      flex: none;
      color: var(--fl-ball);
      font-weight: 800;
    }
  `,
})
export class YouCardComponent {
  private readonly _sheet = inject(MatBottomSheet);
  protected readonly me = inject(MeService);

  public readonly leagueId = input.required<string>();
  public readonly players = input.required<RankedPlayer[]>();
  public readonly games = input.required<Game[]>();
  /** The fewest games to have a place in the ranking. */
  public readonly minGames = input(0);

  /** The player on this device, when they play in this league. */
  protected readonly you = computed(() => {
    const id = this.me.id();
    return (id && this.players().find((player) => player.id === id)) || null;
  });

  private readonly _threshold = computed(() => Math.max(1, this.minGames()));

  /** Their place among the ranked players by Elo (shared on a tie), or `null` below the bar. */
  protected readonly place = computed(() => {
    const you = this.you();
    if (!you || you.games < this._threshold()) {
      return null;
    }
    const ranked = this.players().filter((player) => player.games >= this._threshold());
    return places(ranked, (a, b) => a.rating === b.rating)[ranked.indexOf(you)] ?? null;
  });

  /** Games still missing to get a place, or `null`. */
  protected readonly missing = computed(() => {
    const you = this.you();
    return you && you.games < this._threshold() && you.games > 0
      ? this._threshold() - you.games
      : null;
  });

  /** Today's finished games of the player and their wins. */
  protected readonly today = computed(() => {
    const you = this.you();
    const day = new Date().toDateString();
    const games = you
      ? this.games().filter(
          (game) =>
            game.end && game.players.includes(you.id) && new Date(game.end).toDateString() === day,
        )
      : [];
    return {
      games: games.length,
      wins: games.filter((game) => game.win === teamOf(game, you!.id)).length,
    };
  });

  protected ask(): void {
    openWhoSheet(this._sheet, { leagueId: this.leagueId() });
  }
}
