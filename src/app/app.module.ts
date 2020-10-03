import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';

// modulos
import { HomeModule } from './home/home.module';
import { AdminModule } from './admin/admin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxBootstrapModule } from './modules/ngx-bootstrap.module';
import { AngularModule } from './modules/angular.module';

import { ToastrModule } from 'ngx-toastr';
// import { UploadImgComponent } from './components/upload-img/upload-img.component';
import { IpcService } from './core/services/ipc.service';

import { NgxSpinnerModule } from 'ngx-spinner';
import { LoaderService } from './loader/loader.service';
import { LoaderInterceptor } from './loader/loader.interceptor';
import { NgInitDirective } from './directives/ngInit';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    NgInitDirective,
    //  UploadImgComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    ToastrModule.forRoot(),
    AppRoutingModule,
    NgxSpinnerModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),

    //modulos
    AngularModule,
    MDBBootstrapModule,
    AdminModule,
    BrowserAnimationsModule,
    NgxBootstrapModule,
  ],
  exports: [AngularModule, MDBBootstrapModule, AdminModule, BrowserAnimationsModule, NgxBootstrapModule],
  providers: [LoaderService, { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private readonly _ipc: IpcService) {
    this.getPrintersName();
  }

  getPrintersName() {
    this._ipc.on('printersNameRes', (event: Electron.IpcMessageEvent, res) => {
      this._ipc.PRINTERS_NEW(res);
    });

    this._ipc.send('printerNames');
  }
}
