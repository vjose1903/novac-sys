import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, tap, map, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { FunctionService } from '../core/services/functions.service';
import { DBservice } from '../core/services/bdservice.service';
import { Router } from '@angular/router';
// Note: these are only the initial imports. Add more as needed.

@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(public loadServ: LoaderService, private fun: FunctionService, private dbServ: DBservice, private router: Router) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.fun.nextCanToast(false);
    const token = this.fun.getAuthToken();
    const spinner = request.params.get('spinner');

    if (spinner && spinner === 'no') {
      // remove parameter spinner y no ejecuta el loader
      request.params.delete('spinner');
    } else {
      // Activa el loader
      this.loadServ.isLoading.next(true);
    }

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
          this.dbServ.toastError('Error desconocido favor de comunicarse con Víctor José Vásquez Santos.', 'ERROR', true);
        }
        if (response.error && response.error.msg === 'Para realizar esta accion debe de iniciar sesión.') {
          this.dbServ.toastError(response.error.msg, 'ERROR');
          this.fun.nextCanToast(false);
          this.fun.logout();
          this.router.navigateByUrl('/auth/login');
        }

        return throwError(response);
      }),
      finalize(() => {
        this.loadServ.isLoading.next(false);
      }),
    );
    // return next.handle(request).pipe(
    // );
  }
}
