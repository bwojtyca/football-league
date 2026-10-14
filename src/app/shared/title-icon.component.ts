import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * A title's icon (round 6): one icon set instead of emoji, which differ on every phone. The
 * potato has no Material icon, so it is a small drawing of its own.
 */
@Component({
  selector: 'fl-title-icon',
  imports: [MatIconModule],
  template: `
    @if (name() === 'potato') {
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.2 5.6c2.6-2.4 7.7-2.6 10.3.2 2.7 2.9 2.4 8.2-.3 11.5-2.8 3.4-8.1 4.1-11 1.2-2.6-2.6-2.4-9.8 1-12.9z"
          fill="#c8925a"
        />
        <circle cx="10" cy="9" r="1" fill="#7a4e26" />
        <circle cx="14.5" cy="12.5" r="1" fill="#7a4e26" />
        <circle cx="10.5" cy="15" r="0.9" fill="#7a4e26" />
      </svg>
    } @else {
      <mat-icon aria-hidden="true">{{ name() }}</mat-icon>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      width: 1.15em;
      height: 1.15em;
      vertical-align: -0.2em;
      color: var(--fl-ink);
    }
    svg,
    mat-icon {
      width: 100%;
      height: 100%;
      font-size: 1.15em;
      line-height: 1;
    }
  `,
})
export class TitleIconComponent {
  /** A Material icon's name, or "potato". */
  public readonly name = input.required<string>();
}
