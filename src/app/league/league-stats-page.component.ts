import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { TranslocoPipe } from '@jsverse/transloco';

import { TopBarComponent } from '../shared/top-bar.component';
import { LeagueStatsComponent } from '../stats/league-stats.component';
import { LeagueService } from './league.service';

/** A league's statistics, opened from the top of its games (and from its ranking). */
@Component({
  selector: 'fl-league-stats-page',
  imports: [LeagueStatsComponent, TopBarComponent, TranslocoPipe],
  template: `
    <fl-top-bar [title]="'leagueStats.title' | transloco" [back]="['/l', leagueId(), 'games']" />
    <main class="page">
      <fl-league-stats [leagueId]="leagueId()" />
    </main>
  `,
})
export class LeagueStatsPageComponent {
  private readonly _leagueService = inject(LeagueService);

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));
}
