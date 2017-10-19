import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {GameListComponent} from './game-list/game-list.component';
import {
MatExpansionModule, MatIconModule, MatListModule, MatButtonModule, MatDialogModule, MatInputModule, MatFormFieldModule,
MatAutocompleteModule
} from '@angular/material';
import {GameService} from './game.service';
import {GameDetailComponent} from './game-detail/game-detail.component';
import {GameNewComponent} from './game-new/game-new.component';
import {GameNewDialogComponent} from './game-new/game-new-dialog/game-new-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    MatExpansionModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    GameListComponent,
    GameNewComponent
  ],
  declarations: [
    GameListComponent,
    GameDetailComponent,
    GameNewComponent,
    GameNewDialogComponent
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
