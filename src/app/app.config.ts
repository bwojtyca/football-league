import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withRouterConfig } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import {
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { provideCharts } from 'ng2-charts';

import { routes } from './app.routes';
import { provideI18n } from './i18n/transloco';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash URLs keep deep links (e.g. #/game/<id>) working on static hosts like GitHub Pages.
    // Pages inside a league read its id from the parent route.
    provideRouter(
      routes,
      withHashLocation(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    ...provideI18n(),
    // Only what the rating line chart needs.
    provideCharts({
      registerables: [
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        CategoryScale,
        Filler,
        Tooltip,
      ],
    }),
    // Caches the app itself, so it opens without a network and can be installed on a phone.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
