import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { Notifier } from '../notifier';
import { LeagueService } from './league.service';

interface InviteData {
  league: { id: string; name: string };
}

/** "Invite": a link with a new invitation code, as a QR code to scan at the table. */
export function openInviteDialog(dialog: MatDialog, data: InviteData) {
  return dialog.open(InviteDialogComponent, { data, autoFocus: false, maxWidth: '420px' });
}

@Component({
  selector: 'fl-invite-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, TranslocoPipe],
  template: `
    <header class="fl-dialog-head">
      <h2>{{ 'invite.title' | transloco }}<small>{{ data.league.name }}</small></h2>
      <button matIconButton mat-dialog-close class="close" [attr.aria-label]="'common.close' | transloco">
        <mat-icon>close</mat-icon>
      </button>
    </header>
    <mat-dialog-content>
      <p class="hint">{{ 'invite.hint' | transloco }}</p>
      <div class="qr" [class.loading]="!qr()" [innerHTML]="qr()" role="img" [attr.aria-label]="'invite.qr' | transloco"></div>
      @if (url(); as link) {
        <p class="link">{{ link }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions>
      <button matButton (click)="copy()" [disabled]="!url()">
        <mat-icon>content_copy</mat-icon>{{ 'invite.copy' | transloco }}
      </button>
      @if (canShare) {
        <button matButton="filled" class="fl-cta" (click)="share()" [disabled]="!url()">
          <mat-icon>share</mat-icon>{{ 'invite.share' | transloco }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .hint {
      margin: 0 0 12px;
      color: var(--fl-ink-2);
    }
    /* The code on white, as scanners expect, with a quiet zone. */
    .qr {
      display: grid;
      place-items: center;
      width: min(100%, 280px);
      aspect-ratio: 1;
      margin: 0 auto;
      padding: 12px;
      box-sizing: border-box;
      border-radius: 16px;
      background: #fff;
    }
    .qr.loading {
      background: var(--fl-card-2);
    }
    .qr ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
    .link {
      margin: 12px 0 0;
      overflow-wrap: anywhere;
      font-size: 0.8125rem;
      color: var(--fl-ink-2);
      text-align: center;
    }
  `,
})
export class InviteDialogComponent {
  protected readonly data = inject<InviteData>(MAT_DIALOG_DATA);
  private readonly _leagues = inject(LeagueService);
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _transloco = inject(TranslocoService);
  private readonly _notifier = inject(Notifier);

  protected readonly url = signal<string | null>(null);
  protected readonly qr = signal<SafeHtml | null>(null);
  protected readonly canShare = typeof navigator.share === 'function';

  constructor() {
    this._make().catch((error) => this._notifier.error('error.league', error));
  }

  /** A new invitation code, its link and the link's QR code (the library loads on demand). */
  private async _make(): Promise<void> {
    const code = await this._leagues.invite(this.data.league.id);
    const url = `${location.origin}${location.pathname}#/l/${this.data.league.id}?invite=${code}`;
    this.url.set(url);
    const { toString } = await import('qrcode');
    const svg = await toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
    // The library's own SVG, made here from our link: safe to insert.
    this.qr.set(this._sanitizer.bypassSecurityTrustHtml(svg));
  }

  protected async copy(): Promise<void> {
    const url = this.url();
    if (url) {
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      this._snackBar.open(this._transloco.translate('hub.copied'), undefined, { duration: 2500 });
    }
  }

  protected async share(): Promise<void> {
    const url = this.url();
    if (url) {
      await navigator.share({ title: this.data.league.name, url }).catch(() => undefined);
    }
  }
}
