import 'reflect-metadata';
import '../polyfills';

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';

// modulos
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxBootstrapModule } from './modules/ngx-bootstrap.module';
import { AngularModule } from './modules/angular.module';

import { ToastrModule } from 'ngx-toastr';

import { NgxSpinnerModule } from 'ngx-spinner';

import { NgInitDirective } from './directives/ngInit';
import { PrimengModule } from './modules/primeng.module';
import { InterceptorService } from './loader/interceptor.service';
import { AppRoutingModule } from './app.routing';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { PageNotFoundComponent } from './shared/components';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, NgInitDirective, PageNotFoundComponent],
  imports: [
    CommonModule,
    BrowserModule,
    PrimengModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
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

    BrowserAnimationsModule,
    NgxBootstrapModule,
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
