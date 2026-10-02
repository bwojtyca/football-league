import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Result } from '../player/player';

/** Last results as dots: filled for a win, hollow for a loss; spelled out for screen readers. */
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
    :host {
      display: inline-flex;
      gap: 3px;
      align-items: center;
    }
    i {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      border: 1.5px solid var(--mat-sys-outline);
    }
    i.w {
      width: 7px;
      height: 7px;
      border: 0;
      background: var(--fl-win);
    }
  `,
})
export class FormDotsComponent {
  public readonly results = input.required<Result[]>();
}
