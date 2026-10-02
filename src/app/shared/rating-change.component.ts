import { Component, input } from '@angular/core';

/** A rating change such as +12 or −8, coloured by direction. */
@Component({
  selector: 'fl-change',
  template: `{{ value() > 0 ? '+' : value() < 0 ? '−' : '±' }}{{ abs() }}`,
  host: { '[class.up]': 'value() > 0', '[class.down]': 'value() < 0' },
  styles: `
    :host {
      font-size: 0.8em;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--mat-sys-on-surface-variant);
    }
    :host(.up) {
      color: var(--fl-win);
    }
    :host(.down) {
      color: var(--fl-loss);
    }
  `,
})
export class RatingChangeComponent {
  public readonly value = input.required<number>();

  protected abs(): number {
    return Math.abs(this.value());
  }
}
