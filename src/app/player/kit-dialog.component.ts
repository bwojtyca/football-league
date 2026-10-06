import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

import { Notifier } from '../notifier';
import { Kit, KIT_COLOR_NAMES, KIT_COLORS, KIT_PATTERNS, KitColor, kitOf, NEW_KIT } from './kit';
import { KitFigureComponent } from './kit-figure.component';
import { PlayerService } from './player.service';

export interface KitDialogData {
  playerId: string;
}

export function openKitDialog(dialog: MatDialog, data: KitDialogData) {
  return dialog.open<KitDialogComponent, KitDialogData>(KitDialogComponent, {
    data,
    width: '440px',
    maxWidth: '100vw',
    panelClass: 'fl-full-on-phone',
  });
}

/** Chooses a player's kit (canvas P23): a pattern, two colours and a number. */
@Component({
  selector: 'fl-kit-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, KitFigureComponent, TranslocoPipe],
  template: `
    <header class="head">
      <button matIconButton mat-dialog-close [attr.aria-label]="'common.cancel' | transloco">
        <mat-icon>close</mat-icon>
      </button>
      <h2 mat-dialog-title>
        {{ 'kit.title' | transloco }}
        <small>{{ name }}</small>
      </h2>
    </header>

    <mat-dialog-content>
      @let current = kit();
      <div class="top">
        <div class="preview fl-felt" role="img" [attr.aria-label]="'kit.preview' | transloco">
          <fl-kit-figure [kit]="current" />
        </div>
        <div class="number">
          <span class="fl-kicker" id="kit-number">{{ 'kit.number' | transloco }}</span>
          <div class="stepper">
            <button
              matIconButton
              (click)="step(-1)"
              [disabled]="!current.num"
              [attr.aria-label]="'kit.less' | transloco"
            >
              <mat-icon>remove</mat-icon>
            </button>
            <output aria-labelledby="kit-number" class="fl-board">
              @if (current.num; as num) {
                <b>{{ num }}</b>
              } @else {
                <small>{{ 'kit.noNumber' | transloco }}</small>
              }
            </output>
            <button
              matIconButton
              (click)="step(1)"
              [disabled]="current.num === 99"
              [attr.aria-label]="'kit.more' | transloco"
            >
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <h3 class="fl-kicker" id="kit-pattern">{{ 'kit.pattern' | transloco }}</h3>
      <div class="patterns" role="radiogroup" aria-labelledby="kit-pattern">
        @for (pattern of patterns; track pattern) {
          <button
            role="radio"
            [attr.aria-checked]="current.pattern === pattern"
            [attr.aria-label]="'kit.patterns.' + pattern | transloco"
            (click)="set({ pattern })"
          >
            <fl-kit-figure [kit]="{ pattern, c1: current.c1, c2: current.c2 }" [bust]="true" />
          </button>
        }
      </div>

      @for (key of colorKeys; track key) {
        <h3 class="fl-kicker" [id]="'kit-' + key">{{ 'kit.' + key | transloco }}</h3>
        <div class="colors" role="radiogroup" [attr.aria-labelledby]="'kit-' + key">
          @for (color of colors; track color) {
            <button
              role="radio"
              [attr.aria-checked]="current[key] === color"
              [attr.aria-label]="'kit.colors.' + color | transloco"
              (click)="setColor(key, color)"
            >
              <i [style.background]="hex[color]"></i>
            </button>
          }
        </div>
      }
      <p class="hint">{{ 'kit.hint' | transloco }}</p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button matButton="filled" class="fl-cta wide" (click)="save()">
        {{ 'kit.save' | transloco }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .head {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 6px 8px 0 4px;
    }
    .head h2 {
      flex: 1;
      display: grid;
      margin: 0;
      padding: 0;
      font: 800 1.4rem/1.2 var(--fl-display);
    }
    .head h2::before {
      display: none;
    }
    .head small {
      font: 600 0.8rem/1.2 var(--fl-display);
      color: var(--fl-ink-2);
    }
    .top {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-top: 6px;
    }
    .preview {
      flex: none;
      display: grid;
      place-items: center;
      width: 116px;
      height: 164px;
      border-radius: 16px;
    }
    .preview fl-kit-figure {
      width: 84px;
      height: 140px;
    }
    .number {
      flex: 1;
      display: grid;
      gap: 6px;
    }
    .stepper {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stepper .mat-mdc-icon-button {
      background: var(--fl-card-2);
    }
    output {
      display: grid;
      place-items: center;
      width: 64px;
      height: 48px;
      border-radius: 10px;
      color: var(--fl-ball);
    }
    output b {
      font: 900 1.9rem/1 var(--fl-led);
    }
    output small {
      font: 600 0.7rem/1.1 var(--fl-display);
      color: var(--fl-ink-2);
      text-align: center;
    }
    h3 {
      margin: 16px 0 6px;
    }
    .patterns {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 6px;
    }
    .patterns button {
      display: grid;
      place-items: center;
      height: 52px;
      padding: 0;
      border: 0;
      border-radius: 12px;
      background: var(--fl-card-2);
      cursor: pointer;
    }
    .patterns fl-kit-figure {
      width: 40px;
      height: 40px;
      overflow: hidden;
      border-radius: 50%;
      background: var(--fl-felt-bg);
    }
    .colors {
      display: flex;
      justify-content: space-between;
    }
    .colors button {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      cursor: pointer;
    }
    .colors i {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 0.15);
    }
    /* The chosen one: a ring like a selected chip, without an outline on the others. */
    .patterns button[aria-checked='true'],
    .colors button[aria-checked='true'] {
      box-shadow: inset 0 0 0 2.5px var(--fl-ball);
    }
    .hint {
      margin: 14px 0 0;
      font-size: 0.85rem;
      line-height: 1.4;
      color: var(--fl-ink-2);
    }
    mat-dialog-actions {
      padding: 10px 24px calc(16px + env(safe-area-inset-bottom, 0px));
    }
    .wide {
      width: 100%;
      --mat-button-filled-container-height: 54px;
      font-size: 1.05rem;
    }
  `,
})
export class KitDialogComponent {
  private readonly _players = inject(PlayerService);
  private readonly _notifier = inject(Notifier);
  private readonly _ref = inject(MatDialogRef<KitDialogComponent>);
  private readonly _playerId = inject<KitDialogData>(MAT_DIALOG_DATA).playerId;

  protected readonly name = this._players.getPlayerName(this._playerId);
  protected readonly patterns = KIT_PATTERNS;
  protected readonly colors = KIT_COLOR_NAMES;
  protected readonly colorKeys = ['c1', 'c2'] as const;
  protected readonly hex = KIT_COLORS;

  /** Starts from the player's kit, or a first one to change. */
  protected readonly kit = signal<Kit>(
    kitOf(this._players.player(this._playerId)?.kit) ?? { ...NEW_KIT },
  );

  protected set(change: Partial<Kit>): void {
    this.kit.update((kit) => ({ ...kit, ...change }));
  }

  protected setColor(key: 'c1' | 'c2', color: KitColor): void {
    this.set({ [key]: color });
  }

  /** Numbers 1 to 99; below 1 the shirt has none. */
  protected step(by: number): void {
    this.kit.update((kit) => {
      const num = Math.min(99, (kit.num ?? 0) + by);
      const next: Kit = { pattern: kit.pattern, c1: kit.c1, c2: kit.c2 };
      if (num >= 1) {
        next.num = num;
      }
      return next;
    });
  }

  protected save(): void {
    this._players
      .setKit(this._playerId, this.kit())
      .catch((error) => this._notifier.error('error.kit', error));
    this._ref.close(true);
  }
}
