import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { Notifier } from '../notifier';
import { AuthService } from '../shared/auth.service';
import { TopBarComponent } from '../shared/top-bar.component';
import { crestOf, League, manages } from './league';
import { LeagueService } from './league.service';

/**
 * The account's deleted leagues, on a page of their own, out of the way (owner, 25 Oct 2026):
 * restored by whoever runs them, erased for good by their owners.
 */
@Component({
  selector: 'fl-deleted-leagues',
  imports: [MatButtonModule, TopBarComponent, TranslocoPipe],
  template: `
    <fl-top-bar [title]="'deleted.title' | transloco" back="/leagues" />
    <main class="page">
      <p class="hint">{{ 'deleted.hint' | transloco }}</p>
      @for (league of leagues.deletedLeagues(); track league.id) {
        <section class="card">
          <span class="crest" aria-hidden="true">{{ crest(league.name) }}</span>
          <b class="name">{{ league.name }}</b>
          <div class="actions">
            @if (runs(league)) {
              <button matButton="tonal" (click)="restore(league)">
                {{ 'common.restore' | transloco }}
              </button>
            }
            @if (!league.owner && auth.signedIn()) {
              <!-- A league from before has no owner: take it, to erase it for good too. -->
              <button matButton (click)="claim(league)">{{ 'owner.claim' | transloco }}</button>
            }
            @if (league.owner && runs(league)) {
              <button matButton class="erase" (click)="erase(league)">
                {{ 'owner.erase' | transloco }}
              </button>
            }
          </div>
        </section>
      } @empty {
        <p class="empty">{{ 'deleted.none' | transloco }}</p>
      }
    </main>
  `,
  styles: `
    .hint,
    .empty {
      color: var(--fl-ink-2);
    }
    .card {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      align-items: center;
      gap: 8px 12px;
      margin-bottom: 8px;
      padding: 12px;
      border-radius: 16px;
      background: var(--fl-card);
    }
    .crest {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--fl-paper);
      font: 800 0.8rem/1 var(--fl-display);
    }
    .name {
      overflow-wrap: anywhere;
    }
    .actions {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .erase {
      --mat-button-text-label-text-color: var(--fl-loss);
    }
  `,
})
export class DeletedLeaguesComponent {
  protected readonly leagues = inject(LeagueService);
  protected readonly auth = inject(AuthService);
  private readonly _notifier = inject(Notifier);
  private readonly _transloco = inject(TranslocoService);
  protected readonly crest = crestOf;

  protected runs(league: League): boolean {
    return manages(league, this.auth.uid());
  }

  protected claim(league: League): void {
    this.leagues.claim(league.id).catch((error) => this._notifier.error('error.league', error));
  }

  protected restore(league: League): void {
    this.leagues.restore(league.id).catch((error) => this._notifier.error('error.league', error));
  }

  protected erase(league: League): void {
    if (confirm(this._transloco.translate('owner.eraseConfirm'))) {
      this.leagues.erase(league.id).catch((error) => this._notifier.error('error.league', error));
    }
  }
}
