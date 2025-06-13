import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Environment } from './environments/environment';

if (Environment.production) {
  enableProdMode();
}

const bootstrap = () => bootstrapApplication(AppComponent, appConfig);

if (module['hot']) {
  module['hot'].accept();
  module['hot'].dispose(() => {
    // Aquí puedes realizar cualquier limpieza necesaria
  });
}

bootstrap().catch(err => console.error(err));