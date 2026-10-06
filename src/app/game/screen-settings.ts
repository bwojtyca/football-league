import { GOAL_DETAILS, GoalDetail } from './game';

/**
 * How the game screen opens on this device: how the table lies (quarter turns) and how much a
 * goal tells. Kept in localStorage, so the next game opens the same way.
 */
const ROTATION_KEY = 'fl.rotation';
const DETAIL_KEY = 'fl.goalDetail';

export function readRotation(): number {
  try {
    return Number(localStorage.getItem(ROTATION_KEY)) % 4 || 0;
  } catch {
    return 0;
  }
}

export function saveRotation(rotation: number): void {
  try {
    localStorage.setItem(ROTATION_KEY, String(rotation));
  } catch {
    // Not remembered: private mode or storage blocked.
  }
}

export function readDetail(): GoalDetail {
  try {
    const detail = localStorage.getItem(DETAIL_KEY) as GoalDetail;
    return GOAL_DETAILS.includes(detail) ? detail : 'position';
  } catch {
    return 'position';
  }
}

export function saveDetail(detail: GoalDetail): void {
  try {
    localStorage.setItem(DETAIL_KEY, detail);
  } catch {
    // Not remembered: private mode or storage blocked.
  }
}

const FULLSCREEN_KEY = 'fl.fullscreen';

/** The browser can show the page full screen (not an iPhone, nor the installed app). */
export function canFullscreen(): boolean {
  return (
    !!document.fullscreenEnabled &&
    !matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
  );
}

/** The player chose full screen for games on this device. */
export function wantsFullscreen(): boolean {
  try {
    return localStorage.getItem(FULLSCREEN_KEY) === '1';
  } catch {
    return false;
  }
}

/** Full screen on or off, remembered for the next games (needs a tap: browsers ask for one). */
export async function setFullscreen(on: boolean, remember = true): Promise<void> {
  if (remember) {
    try {
      localStorage.setItem(FULLSCREEN_KEY, on ? '1' : '0');
    } catch {
      // Not remembered: private mode or storage blocked.
    }
  }
  if (on && !document.fullscreenElement && canFullscreen()) {
    await document.documentElement
      .requestFullscreen({ navigationUI: 'hide' })
      .catch(() => undefined);
  } else if (!on && document.fullscreenElement) {
    await document.exitFullscreen().catch(() => undefined);
  }
}
