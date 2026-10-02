import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@jsverse/transloco';

/** Tells the user when something could not be saved, instead of failing silently. */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _transloco = inject(TranslocoService);

  /** Shows the translated `message` key. */
  public error(message: string, error: unknown): void {
    console.error(error);
    this._snackBar.open(
      this._transloco.translate(message),
      this._transloco.translate('common.ok'),
      {
        duration: 6000,
      },
    );
  }
}
