import { CanDeactivateFn } from '@angular/router';

/** A page that may ask before it is left, e.g. while a game runs. */
export interface LeaveGuarded {
  canLeave(): boolean | Promise<boolean>;
}

export const leaveGuard: CanDeactivateFn<LeaveGuarded> = (page) => page.canLeave();
