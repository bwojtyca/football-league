import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withRouterConfig } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import {
  BarController,
  BarElement,
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
    // Only what the line charts (ratings, a game's score) and the bar charts need.
    provideCharts({
      registerables: [
        BarController,
        BarElement,
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        CategoryScale,
        Filler,
        Tooltip,
      ],
      // Axis labels and lines that read on the dark page.
      defaults: { color: '#9aa39d', font: { family: 'Archivo, system-ui, sans-serif' } },
    }),
    // Caches the app itself, so it opens without a network and can be installed on a phone.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
