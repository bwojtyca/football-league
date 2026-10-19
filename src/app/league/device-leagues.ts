import { signal } from '@angular/core';

import { currentLeagueId } from './league';

const RECENT_KEY = 'fl.recentLeagues';
/** How many leagues opened on this device are kept. */
const RECENT_COUNT = 8;

function read(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(ids)
      ? [...new Set(ids.filter((id) => typeof id === 'string').map(currentLeagueId))]
      : [];
  } catch {
    return [];
  }
}

/**
 * Leagues opened on this device, last first: "mine" until there are accounts. On its own (not
 * in `LeagueService`) because `GameService` needs it for the games of "your leagues", and
 * `LeagueService` needs `GameService`.
 */
export const deviceLeagues = signal(read());

/** Puts a league first in the device's list (no change when it already is first). */
export function rememberLeague(id: string): void {
  const recent = deviceLeagues();
  if (recent[0] === id) {
    return;
  }
  const ids = [id, ...recent.filter((other) => other !== id)].slice(0, RECENT_COUNT);
  deviceLeagues.set(ids);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    // Not remembered: private mode or storage blocked.
  }
}
