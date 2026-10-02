import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash URLs keep deep links (e.g. #/game/<id>) working on static hosts like GitHub Pages.
    provideRouter(routes, withHashLocation()),
  ],
};
