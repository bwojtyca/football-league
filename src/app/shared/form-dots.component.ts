import { Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { Result } from '../player/player';

/** Last results as dots: green for a win, a red ring for a loss; spelled out for screen readers. */
@Component({
  selector: 'fl-form',
  imports: [TranslocoPipe],
  // What the dots mean, on hover (evaluations 13–16: no legend).
  host: { '[attr.title]': 'legend()' },
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
    /* Oldest first. */
    :host {
      display: inline-flex;
      gap: 3px;
      align-items: center;
      height: 16px;
    }
    /* A win a filled green dot, a loss a red ring: the colours of the W/P tags in game lists,
       so the dots read without a legend (evaluation 17). */
    i {
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border: 1.5px solid var(--fl-loss);
      border-radius: 50%;
    }
    i.w {
      border-color: var(--fl-win);
      background: var(--fl-win);
    }
  `,
})
export class FormDotsComponent {
  public readonly results = input.required<Result[]>();
  protected readonly legend = toSignal(inject(TranslocoService).selectTranslate('form.legend'));
}
