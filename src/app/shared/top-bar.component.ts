import { Component, computed, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { openLeagueSwitcher } from '../league/league-switcher.component';
import { openAppMenu } from './app-menu-sheet.component';

/**
 * Page header: a back link or the league's menu (its name: invite, settings, another league),
 * the title, the page's actions and the app's menu.
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
          <h1 [class.long]="long()">{{ title() }}</h1>
          <mat-icon aria-hidden="true">expand_more</mat-icon>
        </button>
      } @else {
        <h1 class="title" [class.long]="long()">{{ title() }}</h1>
      }
      <ng-content />
      <!-- The app menu on top-level pages; a page with a back arrow keeps one menu, its own. -->
      @if (!back()) {
        <button
          matIconButton
          class="app-menu"
          (click)="appMenu()"
          [attr.aria-label]="'appMenu.open' | transloco"
        >
          <mat-icon>menu</mat-icon>
        </button>
      }
    </header>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      gap: 4px;
      max-width: calc(var(--fl-page-max, 720px) + 32px);
      margin: 0 auto;
      padding: 8px;
      min-height: 56px;
      box-sizing: border-box;
    }
    .title {
      flex: 1;
      min-width: 0;
    }
    /* A long name: two lines in a smaller size, so the whole name is seen. */
    h1 {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      margin: 0 8px;
      padding-right: 2px;
      overflow: hidden;
      overflow-wrap: anywhere;
      font: 800 1.5rem/1.15 var(--fl-display);
    }
    h1.long {
      font-size: 1.15rem;
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
    .app-menu {
      flex: none;
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

  protected readonly long = computed(() => this.title().length > 22);

  protected appMenu(): void {
    openAppMenu(this._sheet, this.switcher());
  }

  protected switchLeague(): void {
    openLeagueSwitcher(this._sheet, this.switcher());
  }
}
