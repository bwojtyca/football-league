import { Component, computed, input } from '@angular/core';

const COLORS = [
  '#d32f2f',
  '#c2185b',
  '#7b1fa2',
  '#512da8',
  '#303f9f',
  '#1976d2',
  '#0288d1',
  '#0097a7',
  '#00796b',
  '#388e3c',
  '#689f38',
  '#e64a19',
  '#5d4037',
  '#455a64',
];

/**
 * Initials on a colour picked from the player id. Replaces the avatars of
 * api.adorable.io, which has been shut down.
 */
@Component({
  selector: 'fl-avatar',
  template: '{{ initials() }}',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: 50%;
      color: #fff;
      font-weight: 500;
      text-transform: uppercase;
      user-select: none;
    }
  `,
  host: {
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[style.background-color]': 'color()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.4',
  },
})
export class AvatarComponent {
  public readonly playerId = input.required<string>();
  public readonly name = input('');
  public readonly size = input(40);

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
