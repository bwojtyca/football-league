import { Component, computed, inject, input } from '@angular/core';

import { KitFigureComponent } from '../kit-figure.component';
import { kitOf } from '../kit';
import { PlayerService } from '../player.service';

// Jersey colours that sit well on the paper and the dark background.
const COLORS = [
  '#b8322a',
  '#c4581d',
  '#a77a0e',
  '#6b7d1f',
  '#2f7d3c',
  '#11786f',
  '#1f6a93',
  '#28479c',
  '#5a3c9e',
  '#8e3478',
  '#7a4b2a',
  '#4b5a63',
];

/**
 * The player's figure in their kit on the felt, or, without a kit, initials on a colour
 * picked from the player id (they replaced the avatars of api.adorable.io, shut down).
 */
@Component({
  selector: 'fl-avatar',
  imports: [KitFigureComponent],
  template: `
    @if (kit(); as kit) {
      <fl-kit-figure [kit]="kit" [bust]="true" />
    } @else {
      {{ initials() }}
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      border-radius: 50%;
      color: #fff;
      font-family: var(--fl-display);
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      user-select: none;
    }
    :host(.kit) {
      background: var(--fl-felt-bg);
    }
    fl-kit-figure {
      width: 100%;
      height: 100%;
    }
  `,
  host: {
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[class.kit]': '!!kit()',
    '[style.background-color]': 'kit() ? null : color()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.44',
  },
})
export class AvatarComponent {
  private readonly _players = inject(PlayerService);

  public readonly playerId = input.required<string>();
  public readonly name = input('');
  public readonly size = input(40);

  /** The player's kit, when they have chosen one. */
  protected readonly kit = computed(() => kitOf(this._players.player(this.playerId())?.kit));

  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return words[0][0] + words[words.length - 1][0];
    }
    return words[0]?.slice(0, 2) ?? '?';
  });

  protected readonly color = computed(() => {
    let hash = 0;
    for (const char of this.playerId()) {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }
    return COLORS[hash % COLORS.length];
  });
}
