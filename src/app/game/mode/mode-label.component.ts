import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { GameMode } from '../game';

/** How a game is played, e.g. "To 8 · win by 2 · 5 min". */
@Component({
  selector: 'fl-mode-label',
  imports: [TranslocoPipe],
  template: `@for (part of parts(); track part.key) {
    @if (!$first) {
      ·
    }
    {{ part.key | transloco: part.params }}
  }`,
})
export class ModeLabelComponent {
  public readonly mode = input.required<GameMode>();

  protected readonly parts = computed(() => {
    const { target, winBy, max, minutes } = this.mode();
    return [
      { key: 'modes.to', params: { target } },
      ...(winBy === 2
        ? [max ? { key: 'modes.winBy2Max', params: { max } } : { key: 'modes.winBy2', params: {} }]
        : []),
      ...(minutes ? [{ key: 'modes.minutes', params: { n: minutes } }] : []),
    ];
  });
}
