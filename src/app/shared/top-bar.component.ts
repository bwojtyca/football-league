import { Component, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { openLeagueSwitcher } from '../league/league-switcher.component';

/**
 * Page header: a back link or the league switcher, the title and the page's actions. The
 * sections of a league are reached from the bottom navigation.
 */
@Component({
  selector: 'fl-top-bar',
  imports: [MatButtonModule, MatIconModule, RouterLink, TranslocoPipe],
  template: `
    <header class="bar">
      @if (back(); as back) {
        <a matIconButton [routerLink]="back" [attr.aria-label]="'common.back' | transloco">
          <mat-icon>arrow_back</mat-icon>
        </a>
      }
      @if (switcher() !== null) {
        <button
          class="title switch"
          (click)="switchLeague()"
          [attr.aria-label]="'switcher.open' | transloco: { name: title() }"
        >
          <h1>{{ title() }}</h1>
          <mat-icon aria-hidden="true">expand_more</mat-icon>
        </button>
      } @else {
        <h1 class="title">{{ title() }}</h1>
      }
      <ng-content />
    </header>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 8px 8px 8px;
      min-height: 56px;
      box-sizing: border-box;
    }
    .title {
      flex: 1;
      min-width: 0;
    }
    h1 {
      margin: 0 8px;
      padding-right: 2px;
      font: italic 800 1.65rem/1.1 var(--fl-display);
      text-transform: uppercase;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .switch {
      display: flex;
      align-items: center;
      min-height: 44px;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }
    .switch h1 {
      margin-right: 2px;
    }
    .switch mat-icon {
      flex: none;
      color: var(--fl-ink-2);
    }
  `,
})
export class TopBarComponent {
  private readonly _sheet = inject(MatBottomSheet);

  public readonly title = input.required<string>();
  /** Route of the back arrow; no arrow when empty. */
  public readonly back = input<string | unknown[] | null>(null);
  /** The current league: the title then opens the list of leagues. */
  public readonly switcher = input<string | null>(null);

  protected switchLeague(): void {
    openLeagueSwitcher(this._sheet, this.switcher());
  }
}
