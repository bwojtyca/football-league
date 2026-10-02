import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Tells the user when something could not be saved, instead of failing silently. */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly _snackBar = inject(MatSnackBar);

  public error(message: string, error: unknown): void {
    console.error(error);
    this._snackBar.open(message, 'OK', { duration: 6000 });
  }
}
