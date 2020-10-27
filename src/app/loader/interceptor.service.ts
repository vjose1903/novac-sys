import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, tap, map, finalize } from 'rxjs/operators';
import { LoaderService } from './loader.service';
import { FunctionService } from '../core/services/functions.service';
// Note: these are only the initial imports. Add more as needed.

@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(public loaderService: LoaderService, private fun: FunctionService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.fun.getAuthToken();
    this.loaderService.isLoading.next(true);
    if (token) {
      request = request.clone({
        setHeaders: {
          'access-token': `${localStorage.getItem('access-token')}`,
          client: `${localStorage.getItem('client')}`,
          expiry: `${localStorage.getItem('expiry')}`,
          uid: `${localStorage.getItem('uid')}`,
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

        return event;
      }),

      catchError((response: HttpErrorResponse) => {
        // if (response.status === 401) {
        // }
        console.log('response ===> ', response);
        return throwError(response);
      }),
      finalize(() => {
        this.loaderService.isLoading.next(false);
      }),
    );
    // return next.handle(request).pipe(
    // );
  }
}
