import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

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
      background: var(--fl-felt);
    }
  `,
})
export class ThirdsComponent {
  public readonly thirds = input.required<[number, number, number]>();

  protected readonly parts = computed(() => {
    const thirds = this.thirds();
    const total = thirds.reduce((sum, n) => sum + n, 0) || 1;
    return ['thirds.start', 'thirds.middle', 'thirds.end'].map((key, i) => ({
      key,
      count: thirds[i],
      share: Math.round((thirds[i] / total) * 100),
      opacity: [0.45, 0.7, 1][i],
    }));
  });
}
