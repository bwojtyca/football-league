import { Component, model } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@jsverse/transloco';

import { GameMode, MINUTES, TARGETS } from '../game';

/** Picks how a game is played: the target, a two-goal lead and a time limit. */
@Component({
  selector: 'fl-mode-picker',
  imports: [MatChipsModule, MatSlideToggleModule, TranslocoPipe],
  template: `
    <mat-chip-listbox [attr.aria-label]="'modes.target' | transloco" hideSingleSelectionIndicator>
      @for (target of targets; track target) {
        <mat-chip-option
          [selected]="mode().target === target"
          [selectable]="mode().target !== target"
          (selectionChange)="$event.isUserInput && $event.selected && set({ target })"
          >{{ 'modes.to' | transloco: { target } }}</mat-chip-option
        >
      }
    </mat-chip-listbox>

    <mat-slide-toggle [checked]="mode().winBy === 2" (change)="setWinBy2($event.checked)">
      {{ 'modes.winBy2Label' | transloco }}
    </mat-slide-toggle>
    @if (mode().winBy === 2) {
      <p class="hint">{{ 'modes.winBy2Hint' | transloco: { tie: mode().target - 1 } }}</p>
    }

    <mat-slide-toggle [checked]="!!mode().minutes" (change)="setTimed($event.checked)">
      {{ 'modes.timedLabel' | transloco }}
    </mat-slide-toggle>
    @if (mode().minutes; as minutes) {
      <mat-chip-listbox
        [attr.aria-label]="'modes.timedLabel' | transloco"
        hideSingleSelectionIndicator
      >
        @for (option of minuteOptions; track option) {
          <mat-chip-option
            [selected]="minutes === option"
            [selectable]="minutes !== option"
            (selectionChange)="$event.isUserInput && $event.selected && set({ minutes: option })"
            >{{ 'modes.minutes' | transloco: { n: option } }}</mat-chip-option
          >
        }
      </mat-chip-listbox>
      <p class="hint">
        {{ 'modes.timedHint' | transloco: { n: minutes, target: mode().target } }}
      </p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
    }
    mat-chip-listbox {
      --mat-chip-container-height: 36px;
    }
    .hint {
      margin: -4px 0 0;
      font-size: 0.85rem;
      color: var(--fl-ink-2);
    }
  `,
})
export class ModePickerComponent {
  public readonly mode = model.required<GameMode>();

  protected readonly targets = TARGETS;
  protected readonly minuteOptions = MINUTES;

  protected set(changes: Partial<GameMode>): void {
    this.mode.update((mode) => ({ ...mode, ...changes }));
  }

  /** Win by two, with no cap. */
  protected setWinBy2(on: boolean): void {
    this.mode.update(({ winBy, max, ...rest }) => (on ? { ...rest, winBy: 2 } : rest));
  }

  protected setTimed(on: boolean): void {
    this.mode.update(({ minutes, ...rest }) => (on ? { ...rest, minutes: 5 } : rest));
  }
}
