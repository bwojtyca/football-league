import { Component, computed, inject, signal } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { AvatarComponent } from '../../player/avatar/avatar.component';

/** A player offered for a place in the lineups. */
export interface PickerOption {
  id: string;
  name: string;
  /** Current Elo in the league; `null` before their first game. */
  rating: number | null;
  /** Where they already play in this game, or where they mostly play. */
  note: string;
  /** Already placed elsewhere: picking them swaps the two places. */
  placed: boolean;
}

export interface PickerData {
  /** The place being filled, e.g. "Red attack". */
  title: string;
  /** Who holds the place now. */
  current?: string;
  options: PickerOption[];
  /** The attack of a team may stay empty: one player covers both positions. */
  canBeAlone: boolean;
}

/** The choice: a player, playing alone, or a new player for the league. */
export type PickerResult = { player: string } | { alone: true } | { add: true };

export function openPlayerPicker(sheet: MatBottomSheet, data: PickerData) {
  return sheet.open<PlayerPickerSheetComponent, PickerData, PickerResult>(
    PlayerPickerSheetComponent,
    { data },
  );
}

/** Picks the player for one place in the lineups, with a search over the league (P32). */
@Component({
  selector: 'fl-player-picker',
  imports: [AvatarComponent, MatButtonModule, MatIconModule, TranslocoPipe],
  template: `
    <h2>{{ data.title }}</h2>
    @if (data.current) {
      <p class="hint">{{ 'newGame.pickNow' | transloco: { name: data.current } }}</p>
    }
    <input
      class="search"
      type="search"
      autocomplete="off"
      [attr.aria-label]="'newGame.search' | transloco"
      [placeholder]="'newGame.search' | transloco"
      (input)="query.set($any($event.target).value)"
    />
    <ul>
      @if (data.canBeAlone && !query()) {
        <li>
          <button class="alone" (click)="close({ alone: true })">
            <mat-icon>person</mat-icon>
            <span class="who">
              <b>{{ 'newGame.alone' | transloco }}</b>
              <small>{{ 'newGame.aloneHint' | transloco }}</small>
            </span>
          </button>
        </li>
      }
      @for (option of shown(); track option.id) {
        <li>
          <button class="option" (click)="close({ player: option.id })">
            <fl-avatar [playerId]="option.id" [name]="option.name" [size]="40" />
            <span class="who">
              <b>{{ option.name }}</b>
              @if (option.note) {
                <small [class.placed]="option.placed">{{ option.note }}</small>
              }
            </span>
            <span class="rating">{{ option.rating ?? '–' }}</span>
          </button>
        </li>
      }
    </ul>
    <button matButton class="add" (click)="close({ add: true })">
      <mat-icon>person_add</mat-icon>{{ 'newGame.newPlayer' | transloco }}
    </button>
  `,
  styles: `
    :host {
      display: grid;
      gap: 10px;
      padding: 4px 0 8px;
    }
    h2 {
      margin: 0;
      font: 800 1.3rem/1.2 var(--fl-display);
    }
    .hint {
      margin: -4px 0 0;
      font-size: 0.9rem;
      color: var(--fl-ink-2);
    }
    .search {
      height: 44px;
      padding: 0 14px;
      border: 0;
      border-radius: 22px;
      background: var(--fl-card-2);
      color: var(--fl-ink);
      font: 500 1rem var(--fl-display);
    }
    .search:focus {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--fl-ball);
    }
    ul {
      display: grid;
      margin: 0;
      padding: 0;
      max-height: 50vh;
      overflow: auto;
      list-style: none;
    }
    li + li {
      border-top: 1px solid var(--fl-line);
    }
    .option,
    .alone {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      min-height: 56px;
      padding: 6px 4px;
      border: 0;
      background: transparent;
      color: var(--fl-ink);
      text-align: left;
      cursor: pointer;
    }
    .alone .mat-icon {
      width: 40px;
      text-align: center;
      color: var(--fl-ink-2);
    }
    .who {
      flex: 1;
      min-width: 0;
      display: grid;
    }
    .who b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font: 700 1rem/1.3 var(--fl-display);
    }
    .who small {
      font-size: 0.8rem;
      color: var(--fl-ink-2);
    }
    .who small.placed {
      color: var(--fl-ball);
    }
    .rating {
      font: 900 1.2rem/1 var(--fl-led);
      font-variant-numeric: tabular-nums;
    }
    .add {
      justify-self: start;
    }
  `,
})
export class PlayerPickerSheetComponent {
  protected readonly data = inject<PickerData>(MAT_BOTTOM_SHEET_DATA);
  private readonly _ref = inject(MatBottomSheetRef<PlayerPickerSheetComponent, PickerResult>);

  protected readonly query = signal('');

  /** Players whose name starts with what was typed (or has a word starting with it). */
  protected readonly shown = computed(() => {
    const query = this.query().trim().toLowerCase();
    return query
      ? this.data.options.filter((option) =>
          option.name
            .toLowerCase()
            .split(/\s+/)
            .concat(option.name.toLowerCase())
            .some((word) => word.startsWith(query)),
        )
      : this.data.options;
  });

  protected close(result: PickerResult): void {
    this._ref.dismiss(result);
  }
}
