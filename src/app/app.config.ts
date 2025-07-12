import { routes } from './app.routing';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { importProvidersFrom } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { InterceptorService } from './loader/interceptor.service';
import { NgxPermissionsModule } from 'ngx-permissions';
import { NgxExtendedPdfViewerModule, NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';
import { primeNGLocales } from '@core/typescript/primeNG.locales';
import Nora from '@primeuix/themes/nora';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideRouter, withRouterConfig, withComponentInputBinding } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { Environment } from '@environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(NgxPermissionsModule.forRoot()),
    importProvidersFrom(NgxExtendedPdfViewerModule),
    importProvidersFrom(NgxExtendedPdfViewerService),
    importProvidersFrom(ToastrModule.forRoot({ preventDuplicates: true })),
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
      withComponentInputBinding()
    ),
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Nora,
        options: {
          prefix: 'p',
          darkModeSelector: false || 'none',
          cssLayer: false,
        },
      },
      translation: primeNGLocales,
    }),

    // FIREBASE
    provideFirebaseApp(() => initializeApp(Environment.firebaseConfig)),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
  ],
};
