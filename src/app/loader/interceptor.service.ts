// import { Injectable } from '@angular/core';
// import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';

// import { catchError, tap, map, finalize, filter } from 'rxjs/operators';
// import { LoaderService } from './loader.service';
// // Note: these are only the initial imports. Add more as needed.

// @Injectable()
// export class InterceptorService implements HttpInterceptor {
//   constructor(private loaderService: LoaderService) {}

//   intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     console.log('entro ====> ');
//     console.log('request ====> ', request);

//     this.loaderService.isLoading.next(true);
//     const token: string = localStorage.getItem('access-token');

//     if (token) {
//       request = request.clone({
//         setHeaders: {
//           'access-token': `${localStorage.getItem('access-token')}`,
//           client: `${localStorage.getItem('client')}`,
//           expiry: `${localStorage.getItem('expiry')}`,
//           uid: `${localStorage.getItem('uid')}`,
//         },
//       });
//     }

//     return next.handle(request).pipe(
//       map((event) => {
//         if (event instanceof HttpResponse) {
//           console.log(event.headers.keys());
//           console.log('=====>', event);

//           ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach((header) => {
//             const headerValue = event.headers.get(header);
//             // console.log('header -->', header);
//             // console.log('headerValue -->', headerValue);

//             if (headerValue !== null && localStorage.getItem(header) == null) {
//               localStorage.setItem(header, headerValue);
//             }
//           });
//         }
//         // this.spin.hide();
//         return event;
//       }),

//       catchError((response: HttpErrorResponse) => {
//         // this.spin.hide();
//         if (response.status === 401) {
//           console.log('response ===> ', response);
//           // Do something here
//           // Do something here
//         }
//         return throwError(response);
//       }),
//       finalize(() => this.loaderService.isLoading.next(false)),
//     );
//   }
// }

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, tap, map, finalize } from 'rxjs/operators';
// Note: these are only the initial imports. Add more as needed.

@Injectable()
export class InterceptorService implements HttpInterceptor {
  // constructor(private fun: FunctionService, private spinner: NgxSpinnerService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // this.spinner.show();
    const token: string = localStorage.getItem('access-token');

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
            console.log('list-->', event.headers.keys());
            const headerValue = event.headers.get(header);
            console.log('headerValue -->', headerValue);

            if (headerValue !== null && localStorage.getItem(header) == null) {
              localStorage.setItem(header, headerValue);
            }
          });
        }
        // this.spin.hide();
        return event;
      }),

      catchError((response: HttpErrorResponse) => {
        // this.spin.hide();
        if (response.status === 401) {
          console.log('response ===> ', response);
          // Do something here
          // Do something here
        }
        return throwError(response);
      }),
      finalize(() => {
        console.log('ACABO');
      }),
    );
    // return next.handle(request).pipe(
    // );
  }
}
