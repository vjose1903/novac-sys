import 'reflect-metadata';
import '../polyfills';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxBootstrapModule } from './modules/ngx-bootstrap.module';
import { ToastrModule } from 'ngx-toastr';
import { NgInitDirective } from './directives/ngInit';
import { PrimengModule } from './modules/primeng.module';
import { InterceptorService } from './loader/interceptor.service';
import { AppRoutingModule } from './app.routing';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { NewModalModule } from './admin/components/modal/modal.module';
import { FormulariosEnModalesModule } from './admin/components/formularios en modales/formularios-en-modales.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { esLocale } from 'ngx-bootstrap/locale';
import { NgxPermissionsModule } from 'ngx-permissions';
import { ConfirmacionImprimirComponent } from './admin/facturacion/confirmacion-imprimir/confirmacion-imprimir.component';

defineLocale('es', esLocale);

@NgModule({
  declarations: [AppComponent, NgInitDirective, PageNotFoundComponent, ConfirmacionImprimirComponent],
  imports: [
    CommonModule,
    BrowserModule,
    PrimengModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CoreModule,
    ToastrModule.forRoot({ preventDuplicates: true }),
    NgxPermissionsModule.forRoot(),
    AppRoutingModule,
    BrowserAnimationsModule,
    NgxBootstrapModule,
    NewModalModule,
    NgSelectModule,
    FormulariosEnModalesModule,
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }],
  bootstrap: [AppComponent],
  exports: [NgxPermissionsModule],
})
export class AppModule {}
