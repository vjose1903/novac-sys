import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, tap, map, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { FunctionService } from '../core/services/functions.service';
import { DBservice } from '../core/services/bdservice.service';
import { Router } from '@angular/router';
import * as _ from 'lodash';
// Note: these are only the initial imports. Add more as needed.

@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(public loadServ: LoaderService, private fun: FunctionService, private dbServ: DBservice, private router: Router) {}
  requestCount: number = 0;

  private startRequest(args?): void {
    if (this.requestCount == 0 && args !== 'no_show') this.loadServ.isLoading.next(true);
    this.requestCount++;
  }

  private endRequest(args?): void {
    this.requestCount--;

    if (this.requestCount == 0 && args !== 'no_hide') this.loadServ.isLoading.next(false);
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.fun.nextCanToast(false);
    const token = this.fun.getAuthToken();

    let spinner = request.params.get('spinner');

    if (spinner) request.params.delete('spinner'); // remove parameter spinner y no ejecuta el loader

    if (!spinner || spinner == 'no_hide') this.startRequest(spinner); // Activa el spinner

    if (token) {
      request = request.clone({
        setHeaders: {
          'access-token': `${localStorage.getItem('access-token')}`,
          client: `${localStorage.getItem('client')}`,
          expiry: `${localStorage.getItem('expiry')}`,
          uid: `${localStorage.getItem('uid')}`,
          'token-type': `${localStorage.getItem('token-type')}`,
        },
      });
    }

    return next.handle(request).pipe(
      map((event) => {
        if (event instanceof HttpResponse) {
          if (_.has(event, 'body.msg')) this.handler_msg(event.body.msg, 'success');

          ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach((header) => {
            const headerValue = event.headers.get(header);
            if (headerValue !== null && localStorage.getItem(header) == null) {
              localStorage.setItem(header, headerValue);
            }
          });
        }

        this.fun.nextCanToast(true);
        return event;
      }),

      catchError((response: HttpErrorResponse) => {
        if (response.error === null) {
          this.dbServ.toastError('Error desconocido favor de comunicarse con Víctor José Vásquez Santos.', 'ERROR');
        } else if (response.error && response.error.msg === 'Para realizar esta accion debe de iniciar sesión.') {
          this.dbServ.toastError(response.error.msg, 'ERROR');
          this.fun.nextCanToast(false);
          this.fun.logout();
          this.router.navigateByUrl('/auth/login');
        } else {
          if (_.has(response, 'error.msg')) this.handler_msg(response.error.msg, 'error');
        }

        return throwError(response);
      }),
      finalize(() => {
        this.endRequest(spinner);
      }),
    );
    // return next.handle(request).pipe(
    // );
  }

  handler_msg(menssages, tipo_) {
    console.warn('MENSAJE DESDE EL INTERCEPTOR');
    console.warn('menssages ', menssages);

    if (menssages && Array.isArray(menssages)) {
      for (let i = 0; i < menssages.length; i++) {
        const menssage = menssages[i];

        if (tipo_ === 'success') this.dbServ.toastSuccess(menssage, 'CORRECTO');
        if (tipo_ === 'error') this.dbServ.toastError(menssage, 'ERROR');
      }
    }
  }
}
