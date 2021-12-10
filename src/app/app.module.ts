import 'reflect-metadata';
import '../polyfills';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { AppComponent } from './app.component';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxBootstrapModule } from './modules/ngx-bootstrap.module';
import { AngularModule } from './modules/angular.module';
import { ToastrModule } from 'ngx-toastr';
import { NgInitDirective } from './directives/ngInit';
import { PrimengModule } from './modules/primeng.module';
import { InterceptorService } from './loader/interceptor.service';
import { AppRoutingModule } from './app.routing';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

import { defineLocale } from 'ngx-bootstrap/chronos';
import { esLocale } from 'ngx-bootstrap/locale';
defineLocale('es', esLocale);

@NgModule({
  declarations: [AppComponent, NgInitDirective, PageNotFoundComponent],
  imports: [
    CommonModule,
    BrowserModule,
    PrimengModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    ToastrModule.forRoot({ preventDuplicates: true }),
    AppRoutingModule,
    AngularModule,
    MDBBootstrapModule,
    BrowserAnimationsModule,
    NgxBootstrapModule,
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
