import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Rod } from '../game/game';
import { LineStats } from './stats';

/** Goals by rod and by figure, with how many goals were told in that detail. */
@Component({
  selector: 'fl-lines',
  imports: [TranslocoPipe],
  template: `
    <p class="hint">
      {{ 'lines.known' | transloco: { n: stats().known, total: stats().known + stats().unknown } }}
    </p>
    <table>
      <thead>
        <tr>
          <th scope="col">{{ 'lines.rod' | transloco }}</th>
          <th scope="col">{{ 'lines.goals' | transloco }}</th>
          <th scope="col">{{ 'lines.own' | transloco }}</th>
          <th scope="col">{{ 'lines.men' | transloco }}</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.rod) {
          <tr>
            <th scope="row">{{ 'rods.' + row.rod | transloco }}</th>
            <td>{{ row.goals }}</td>
            <td>{{ row.own }}</td>
            <td class="men">{{ row.men }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    .hint {
      margin: 0 0 8px;
      color: var(--fl-ink-2);
      font-size: 0.85rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-variant-numeric: tabular-nums;
    }
    th,
    td {
      padding: 5px 4px;
      border-bottom: 1px solid var(--fl-line);
      text-align: right;
    }
    th:first-child {
      text-align: left;
      font-weight: 500;
    }
    thead th {
      color: var(--fl-ink-2);
      font-weight: 600;
    }
    .men {
      color: var(--fl-ink-2);
      font-size: 0.85rem;
    }
  `,
})
export class LinesComponent {
  public readonly stats = input.required<LineStats>();

  /** Each rod with its goals by figure as "1: 2 · 2: 5", when any figure was told. */
  protected readonly rows = computed(() =>
    (['goalie', 'defence', 'midfield', 'attack'] as Rod[]).map((rod) => {
      const { goals, own, men } = this.stats().rods[rod];
      return {
        rod,
        goals,
        own,
        men: men.some(Boolean) ? men.map((n, i) => `${i + 1}: ${n}`).join(' · ') : '',
      };
    }),
  );
}
