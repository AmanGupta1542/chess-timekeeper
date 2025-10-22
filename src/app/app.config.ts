import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode, InjectionToken } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { DatePipe } from '@angular/common';

export interface AdsenseConfig {
  publisherId: string;
  // Other Adsense related configurations
}

// Create the InjectionToken for AdsenseConfig if not already defined in the Adsense library
export const ADSENSE_CONFIG = new InjectionToken<AdsenseConfig>('AdsenseConfig');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    DatePipe,
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()), 
    // provideClientHydration(withEventReplay()), 
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),

    {
      provide: ADSENSE_CONFIG, // The token you're trying to inject
      useValue: { // The value to provide for the token
        publisherId: 'pub-6327262812722922',
        // ... other Adsense config properties
      } as AdsenseConfig,
    },
  ]
};




