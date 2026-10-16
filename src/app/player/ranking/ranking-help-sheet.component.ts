import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { TranslocoPipe } from '@jsverse/transloco';

import { TitleIconComponent } from '../../shared/title-icon.component';
import { TITLE_GAMES, TITLES, TitleId } from '../../stats/titles';
import { POTATO_DAY_GAMES, POTATO_POINTS } from '../potato';
import { PROVISIONAL_GAMES } from '../rating';
import { SheetCloseComponent } from '../../shared/sheet-close.component';

/** Fewest games together for a pair to be in the ranking of duets. */
export const DUET_GAMES = 3;

export function openRankingHelp(sheet: MatBottomSheet) {
  return sheet.open(RankingHelpSheetComponent);
}

/**
 * How to read the ranking (canvas R6-liga, "?"): Elo, win %, pairs, the potato's rules, the
 * titles and the form dots, one tap from the ranking instead of guessed from emoji.
 */
@Component({
  selector: 'fl-ranking-help',
  imports: [SheetCloseComponent, TitleIconComponent, TranslocoPipe],
  template: `
    <h2 class="title">{{ 'ranking.helpTitle' | transloco }}</h2>
    <section>
      <h3>Elo</h3>
      <p>{{ 'ranking.helpElo' | transloco: { n: provisionalGames } }}</p>
    </section>
    <section>
      <h3>{{ 'ranking.winRate' | transloco }}</h3>
      <p>{{ 'ranking.helpWinRate' | transloco }}</p>
    </section>
    <section>
      <h3>{{ 'league.duets' | transloco }}</h3>
      <p>{{ 'ranking.helpDuets' | transloco: { n: duetGames } }}</p>
    </section>
    <section>
      <h3><fl-title-icon name="potato" /> {{ 'potato.title' | transloco }}</h3>
      <ul>
        <li>{{ 'potato.ruleDay' | transloco: { n: potatoDayGames } }}</li>
        <li>{{ 'potato.ruleLoss' | transloco: { n: points.loss, m: -points.win } }}</li>
        <li>{{ 'potato.ruleShutout' | transloco: { n: points.shutoutLoss } }}</li>
        <li>{{ 'potato.ruleUpset' | transloco: { n: points.upsetLoss } }}</li>
        <li>{{ 'potato.ruleLossToPotato' | transloco: { n: points.lossToPotato } }}</li>
        <li>{{ 'potato.rulePotatoWin' | transloco: { n: -points.potatoWin } }}</li>
      </ul>
    </section>
    <section>
      <h3>{{ 'titles.title' | transloco }}</h3>
      <dl class="titles">
        @for (title of titles; track title.id) {
          <div>
            <dt>
              <fl-title-icon [name]="title.icon" />
              {{ 'titles.' + title.id + '.name' | transloco }}
            </dt>
            <dd>{{ 'titles.' + title.id + '.hint' | transloco: { n: titleGames } }}</dd>
          </div>
        }
      </dl>
    </section>
    <section>
      <h3>{{ 'ranking.helpFormTitle' | transloco }}</h3>
      <p>{{ 'ranking.helpForm' | transloco }}</p>
    </section>
    <fl-sheet-close />
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 0 calc(12px + env(safe-area-inset-bottom, 0px));
    }
    .title {
      margin: 0 0 8px;
      font: var(--fl-sheet-title);
    }
    section + section {
      margin-top: 14px;
    }
    h3 {
      margin: 0 0 4px;
      font: 800 1.05rem/1.3 var(--fl-display);
    }
    p,
    li,
    dd {
      color: var(--fl-ink-2);
      font-size: 0.9rem;
      line-height: 1.45;
    }
    p {
      margin: 0;
    }
    ul {
      margin: 0;
      padding-left: 18px;
    }
    .titles {
      display: grid;
      gap: 8px;
      margin: 0;
    }
    dt {
      font-weight: 700;
    }
    dd {
      margin: 0;
    }
  `,
})
export class RankingHelpSheetComponent {
  protected readonly provisionalGames = PROVISIONAL_GAMES;
  protected readonly duetGames = DUET_GAMES;
  protected readonly potatoDayGames = POTATO_DAY_GAMES;
  protected readonly points = POTATO_POINTS;
  protected readonly titleGames = TITLE_GAMES;
  protected readonly titles = (Object.keys(TITLES) as TitleId[]).map((id) => ({
    id,
    icon: TITLES[id],
  }));
}
