import { Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { Result } from '../player/player';

/** Last results as LED dots: lit for a win, dark for a loss; spelled out for screen readers. */
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
    /* Lit dots for wins, dark ones for losses, oldest first. */
    :host {
      display: inline-flex;
      gap: 3px;
      align-items: center;
      height: 16px;
    }
    /* A loss is a ring (8:1 on black), a win a filled dot. */
    i {
      box-sizing: border-box;
      width: 8px;
      height: 8px;
      border: 1.5px solid var(--fl-ink-2);
      border-radius: 50%;
    }
    i.w {
      border-color: var(--fl-ink);
      background: var(--fl-ink);
    }
  `,
})
export class FormDotsComponent {
  public readonly results = input.required<Result[]>();
  protected readonly legend = toSignal(inject(TranslocoService).selectTranslate('form.legend'));
}
