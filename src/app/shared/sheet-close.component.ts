import { Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * The close disc of a bottom sheet, at its top right as on the dialogs (evaluation 5: sheets had
 * none, dialogs did). Place it last in the sheet's template.
 */
@Component({
  selector: 'fl-sheet-close',
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  template: `
    <button matIconButton (click)="ref.dismiss()" [attr.aria-label]="'common.close' | transloco">
      <mat-icon>close</mat-icon>
    </button>
  `,
  styles: `
    :host {
      position: absolute;
      top: 8px;
      right: 8px;
    }
    button {
      background: var(--fl-card-2);
    }
  `,
})
export class SheetCloseComponent {
  protected readonly ref = inject(MatBottomSheetRef);
}
