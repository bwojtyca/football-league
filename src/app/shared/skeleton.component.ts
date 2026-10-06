import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Grey placeholder rows (an avatar and two lines) while a list loads, so the page keeps its
 * shape instead of showing a lone spinner or an "empty" note too early.
 */
@Component({
  selector: 'fl-skeleton',
  imports: [TranslocoPipe],
  host: { role: 'status', 'aria-busy': 'true' },
  template: `
    <span class="sr-only">{{ 'common.loading' | transloco }}</span>
    @for (row of list(); track row) {
      <div class="row" aria-hidden="true">
        <i class="dot"></i>
        <span class="lines">
          <i [style.width.%]="row % 3 === 0 ? 46 : row % 3 === 1 ? 62 : 38"></i>
          <i class="short"></i>
        </span>
        <i class="end"></i>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 60px;
      padding: 6px 4px;
    }
    i {
      display: block;
      border-radius: 6px;
      background: var(--fl-card-2);
      animation: fl-pulse 1.4s ease-in-out infinite;
    }
    .dot {
      flex: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }
    .lines {
      flex: 1;
      display: grid;
      gap: 8px;
    }
    .lines i {
      height: 12px;
    }
    .lines .short {
      width: 24%;
      height: 10px;
    }
    .end {
      flex: none;
      width: 44px;
      height: 20px;
    }
    @keyframes fl-pulse {
      50% {
        opacity: 0.45;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      i {
        animation: none;
      }
    }
  `,
})
export class SkeletonComponent {
  /** How many rows to show. */
  public readonly rows = input(6);
  protected readonly list = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
