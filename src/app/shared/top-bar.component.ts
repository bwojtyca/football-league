import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { LANGUAGES } from '../i18n/transloco';

/** Page header: optional back link, title, page actions and the app menu. */
@Component({
  selector: 'fl-top-bar',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterLink, TranslocoPipe],
  template: `
    <header class="bar">
      @if (back(); as back) {
        <a matIconButton [routerLink]="back" [attr.aria-label]="'common.back' | transloco">
          <mat-icon>arrow_back</mat-icon>
        </a>
      }
      <h1>{{ title() }}</h1>
      <ng-content />
      <button
        matIconButton
        [matMenuTriggerFor]="menu"
        [attr.aria-label]="'common.menu' | transloco"
      >
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <a mat-menu-item routerLink="/leagues">
          <mat-icon>emoji_events</mat-icon>{{ 'menu.leagues' | transloco }}
        </a>
        <a mat-menu-item routerLink="/ranking">
          <mat-icon>leaderboard</mat-icon>{{ 'ranking.global' | transloco }}
        </a>
        @for (option of languages; track option.lang) {
          <button mat-menu-item (click)="transloco.setActiveLang(option.lang)">
            <mat-icon>{{
              transloco.activeLang() === option.lang
                ? 'radio_button_checked'
                : 'radio_button_unchecked'
            }}</mat-icon>
            {{ option.label }}
          </button>
        }
      </mat-menu>
    </header>
  `,
  styles: `
    .bar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 4px 8px 8px;
      min-height: 56px;
      box-sizing: border-box;
    }
    h1 {
      flex: 1;
      min-width: 0;
      margin: 0 8px;
      font: 700 1.5rem/1.1 var(--fl-display);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class TopBarComponent {
  protected readonly transloco = inject(TranslocoService);

  public readonly title = input.required<string>();
  /** Route of the back arrow; no arrow when empty. */
  public readonly back = input<string | null>(null);

  protected readonly languages = LANGUAGES;
}
