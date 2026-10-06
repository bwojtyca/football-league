import { Component, computed, input } from '@angular/core';

import { Kit, KIT_COLORS } from './kit';

/** The shirt's outline, shared by its fill and the clip of its pattern. */
const SHIRT = 'M17 30 Q17 27 20 27 L40 27 Q43 27 43 30 L41 58 L19 58 Z';

let nextId = 0;

/**
 * A foosball figure in a player's kit (canvas `Fig`): the whole figure on its rod, or the
 * bust for avatars. The head is plain plastic, as on a real table.
 */
@Component({
  selector: 'fl-kit-figure',
  template: `
    <svg [attr.viewBox]="bust() ? '8 2 44 44' : '0 0 60 100'" aria-hidden="true">
      <defs>
        <clipPath [attr.id]="clipId"><path [attr.d]="shirt" /></clipPath>
      </defs>
      @if (!bust()) {
        <rect x="-20" y="31" width="100" height="5" fill="#b9c0c6" />
        <rect x="-20" y="32" width="100" height="1.5" fill="#eef1f3" />
      }
      <path d="M17 30 L11 47 Q10.5 50 13.5 50 L16.5 49 L19 36 Z" [attr.fill]="armLeft()" />
      <path d="M43 30 L49 47 Q49.5 50 46.5 50 L43.5 49 L41 36 Z" [attr.fill]="armRight()" />
      <path [attr.d]="shirt" [attr.fill]="c1()" />
      <g [attr.clip-path]="'url(#' + clipId + ')'" [attr.fill]="c2()">
        @switch (kit().pattern) {
          @case ('stripes') {
            <rect x="19" y="27" width="3" height="31" />
            <rect x="25" y="27" width="3" height="31" />
            <rect x="31" y="27" width="3" height="31" />
            <rect x="37" y="27" width="3" height="31" />
          }
          @case ('hoops') {
            <rect x="10" y="31" width="40" height="3.5" />
            <rect x="10" y="38" width="40" height="3.5" />
            <rect x="10" y="45" width="40" height="3.5" />
            <rect x="10" y="52" width="40" height="3.5" />
          }
          @case ('halves') {
            <rect x="30" y="27" width="14" height="31" />
          }
          @case ('sash') {
            <polygon points="15,31 21,25 46,52 40,60" />
          }
          @case ('quarters') {
            <rect x="17" y="27" width="13" height="15.5" />
            <rect x="30" y="42.5" width="13" height="15.5" />
          }
        }
      </g>
      @if (kit().pattern === 'plain') {
        <path d="M25 27 L30 33 L35 27" fill="none" [attr.stroke]="c2()" stroke-width="2.2" />
      }
      @if (kit().num; as num) {
        <text
          x="30"
          [attr.y]="bust() ? 44 : 50"
          text-anchor="middle"
          [attr.font-size]="bust() ? 11 : 13"
          fill="#ffffff"
          stroke="#0e1a12"
          stroke-width="2"
          paint-order="stroke"
        >{{ num }}</text>
      }
      @if (!bust()) {
        <path
          d="M19 58 L41 58 L42.5 70 L31.5 70 L30 66 L28.5 70 L17.5 70 Z"
          [attr.fill]="c2()"
        />
        <path d="M20 70 L40 70 L38.5 88 L21.5 88 Z" [attr.fill]="c1()" />
        <path d="M21.5 87 L38.5 87 L38 93 Q37 98 30 98 Q23 98 22 93 Z" fill="#1f1f1f" />
      }
      <circle cx="30" cy="15" r="10.5" fill="#e4e1d8" />
      <circle cx="26.5" cy="16" r="1.1" fill="#3b3a36" />
      <circle cx="33.5" cy="16" r="1.1" fill="#3b3a36" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    text {
      font-family: var(--fl-display);
      font-weight: 800;
    }
  `,
})
export class KitFigureComponent {
  public readonly kit = input.required<Kit>();
  /** The bust (head and chest, for avatars) instead of the whole figure on its rod. */
  public readonly bust = input(false);

  protected readonly shirt = SHIRT;
  protected readonly clipId = `fl-kit-${nextId++}`;

  protected readonly c1 = computed(() => KIT_COLORS[this.kit().c1]);
  protected readonly c2 = computed(() => KIT_COLORS[this.kit().c2]);
  protected readonly armLeft = computed(() =>
    this.kit().pattern === 'quarters' ? this.c2() : this.c1(),
  );
  protected readonly armRight = computed(() =>
    this.kit().pattern === 'halves' ? this.c2() : this.c1(),
  );
}
