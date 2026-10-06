import { Injectable, signal } from '@angular/core';

/** The browser's offer to install the app (Chrome and Edge; not part of the DOM typings). */
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Installing the app on a phone: full screen without the browser's bar. Chrome and Edge offer
 * it through an event kept here; an iPhone only through Share › Add to Home Screen.
 */
@Injectable({ providedIn: 'root' })
export class InstallService {
  private _prompt?: InstallPrompt;

  /** Already running installed (or full screen). */
  public readonly installed = signal(
    matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches,
  );
  /** The browser can install it with one tap. */
  public readonly canInstall = signal(false);
  /** An iPhone or iPad in Safari: installing takes Share › Add to Home Screen. */
  public readonly iosHint = /iphone|ipad|ipod/i.test(navigator.userAgent);

  constructor() {
    addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this._prompt = event as InstallPrompt;
      this.canInstall.set(true);
    });
    addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.canInstall.set(false);
    });
  }

  public async install(): Promise<void> {
    if (!this._prompt) {
      return;
    }
    await this._prompt.prompt();
    const { outcome } = await this._prompt.userChoice;
    if (outcome === 'accepted') {
      this.canInstall.set(false);
    }
  }
}
