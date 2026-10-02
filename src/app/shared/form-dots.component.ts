import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Result } from '../player/player';

/** Last results as bars: tall for a win, short for a loss; spelled out for screen readers. */
@Component({
  selector: 'fl-form',
  imports: [TranslocoPipe],
  template: `
    <span class="sr-only">
      {{ 'form.label' | transloco }}
      @for (r of results(); track $index) {
        {{ (r === 'W' ? 'result.win' : 'result.loss') | transloco }}
      }
    </span>
    @for (r of results(); track $index) {
      <i [class.w]="r === 'W'" aria-hidden="true"></i>
    }
  `,
  styles: `
    /* Tall green bars for wins, short grey ones for losses, oldest first. */
    :host {
      display: inline-flex;
      gap: 3px;
      align-items: flex-end;
      height: 16px;
    }
    i {
      width: 5px;
      height: 6px;
      border-radius: 2px;
      background: var(--fl-line);
    }
    i.w {
      height: 16px;
      background: var(--fl-win);
    }
  `,
})
export class FormDotsComponent {
  public readonly results = input.required<Result[]>();
}
