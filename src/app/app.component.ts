import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';

@Component({
  selector: 'fl-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly _document = inject(DOCUMENT);
  private readonly _transloco = inject(TranslocoService);
  private readonly _snackBar = inject(MatSnackBar);

  constructor() {
    this._transloco.langChanges$
      .pipe(takeUntilDestroyed())
      .subscribe((lang) => (this._document.documentElement.lang = lang));

    // The service worker fetches a new deploy in the background; offer to switch to it.
    inject(SwUpdate)
      .versionUpdates.pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'),
        takeUntilDestroyed(),
      )
      .subscribe(() => this._offerReload());
  }

  private _offerReload(): void {
    this._snackBar
      .open(this._transloco.translate('app.updateReady'), this._transloco.translate('app.reload'))
      .onAction()
      .subscribe(() => this._document.location.reload());
  }
}
