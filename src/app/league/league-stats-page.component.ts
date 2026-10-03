import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { TopBarComponent } from '../shared/top-bar.component';
import { LeagueStatsComponent } from '../stats/league-stats.component';
import { GamesSwitchComponent } from './games-switch.component';
import { LeagueService } from './league.service';

/** A league's statistics, next to its list of games. */
@Component({
  selector: 'fl-league-stats-page',
  imports: [GamesSwitchComponent, LeagueStatsComponent, TopBarComponent],
  template: `
    <fl-top-bar [title]="league()?.name ?? ''" [switcher]="leagueId()" />
    <main class="page">
      <fl-games-switch [leagueId]="leagueId()" current="stats" />
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
