import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { GameListComponent } from '../game/game-list/game-list.component';
import { TopBarComponent } from '../shared/top-bar.component';
import { LeagueService } from './league.service';

/** A league's games, newest first. */
@Component({
  selector: 'fl-league-games',
  imports: [GameListComponent, TopBarComponent],
  template: `
    <fl-top-bar [title]="league()?.name ?? ''" [switcher]="leagueId()" />
    <main class="page">
      <fl-game-list [leagueId]="leagueId()" [pageSize]="30" />
    </main>
  `,
})
export class LeagueGamesComponent {
  private readonly _leagueService = inject(LeagueService);

  protected readonly leagueId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('leagueId') ?? '')),
    { initialValue: '' },
  );
  protected readonly league = computed(() => this._leagueService.league(this.leagueId()));
}
