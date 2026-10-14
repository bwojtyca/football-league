import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { percentages } from './format';

/** Goals in the first, middle and last third of their games, as shares on one bar. */
@Component({
  selector: 'fl-thirds',
  imports: [TranslocoPipe],
  template: `
    <div class="fl-split">
      <div class="labels">
        @for (part of parts(); track part.key) {
          <span
            >{{ part.key | transloco }} <b>{{ part.share }}%</b></span
          >
        }
      </div>
      <div class="bar" aria-hidden="true">
        @for (part of parts(); track part.key) {
          <i [style.flex]="part.count || 0.0001" [style.opacity]="part.opacity"></i>
        }
      </div>
    </div>
  `,
  styles: `
    /* One hue, darker for later in the game. */
    i {
      background: var(--fl-chart);
    }
  `,
})
export class ThirdsComponent {
  public readonly thirds = input.required<[number, number, number]>();

  protected readonly parts = computed(() => {
    const thirds = this.thirds();
    const shares = percentages(thirds);
    return ['thirds.start', 'thirds.middle', 'thirds.end'].map((key, i) => ({
      key,
      count: thirds[i],
      share: shares[i],
      opacity: [0.45, 0.7, 1][i],
    }));
  });
}
