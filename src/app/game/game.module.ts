import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GameListComponent } from './game-list/game-list.component';
import {
  MatExpansionModule, MatIconModule, MatListModule, MatButtonModule, MatDialogModule, MatInputModule, MatFormFieldModule,
  MatAutocompleteModule, MatProgressSpinnerModule, MatCheckboxModule, MatCardModule
} from '@angular/material';
import { GameService } from './game.service';
import { GameDetailComponent } from './game-detail/game-detail.component';
import { GameNewComponent } from './game-new/game-new.component';
import { GameNewDialogComponent } from './game-new/game-new-dialog/game-new-dialog.component';
import { HighlightPipe } from './highlight.pipe';

@NgModule({
  imports: [
    CommonModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    FormsModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterModule.forRoot([{
      path: 'game/:gameId',
      component: GameDetailComponent
    }])
  ],
  exports: [
    GameListComponent,
    GameNewComponent
  ],
  declarations: [
    GameListComponent,
    GameDetailComponent,
    GameNewComponent,
    GameNewDialogComponent,
    HighlightPipe
  ],
  providers: [
    GameService
  ],
  entryComponents: [
    GameNewDialogComponent
  ]
})
export class GameModule {
}
