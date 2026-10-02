import { DestroyRef, DOCUMENT, effect, inject } from '@angular/core';

/**
 * Keeps the screen on while `active()` is true, where the browser supports it. Call from
 * a component constructor. The browser drops the lock when the page is hidden, so it is
 * taken again when the page comes back.
 */
export function keepScreenOn(active: () => boolean): void {
  const document = inject(DOCUMENT);
  let lock: WakeLockSentinel | undefined;

  const request = async () => {
    if (lock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') {
      return;
    }
    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => (lock = undefined));
    } catch {
      // Not allowed right now (e.g. battery saver); the screen simply may turn off.
    }
  };
  const release = () => {
    lock?.release().catch(() => undefined);
    lock = undefined;
  };
  const onVisibilityChange = () => {
    if (active()) {
      request();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  effect(() => (active() ? request() : release()));
  inject(DestroyRef).onDestroy(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    release();
  });
}
