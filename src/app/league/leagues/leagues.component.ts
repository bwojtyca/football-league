import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';

import { GameService } from '../../game/game.service';
import { Notifier } from '../../notifier';
import { TopBarComponent } from '../../shared/top-bar.component';
import { LeagueService } from '../league.service';

@Component({
  selector: 'fl-leagues',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
    TopBarComponent,
    TranslocoDatePipe,
    TranslocoPipe,
  ],
  templateUrl: './leagues.component.html',
  styleUrl: './leagues.component.scss',
})
export class LeaguesComponent {
  private readonly _leagueService = inject(LeagueService);
  private readonly _gameService = inject(GameService);
  private readonly _router = inject(Router);
  private readonly _notifier = inject(Notifier);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
  });

  protected readonly leagues = computed(() =>
    this._leagueService.leagues()?.map((league) => {
      const games = this._gameService.leagueGames(league.id);
      return { ...league, games: games?.length, lastGame: games?.[0]?.start };
    }),
  );

  protected readonly onlyArchive = computed(() =>
    this.leagues()?.every((league) => league.archived),
  );

  protected create(): void {
    const control = this.form.controls.name;
    const name = control.value.trim();
    if (!name) {
      control.setValue('');
      control.markAsTouched();
      return;
    }
    const { id, saved } = this._leagueService.createLeague(name);
    saved.catch((error) => this._notifier.error('error.createLeague', error));
    this._router.navigate(['/l', id]);
  }
}
