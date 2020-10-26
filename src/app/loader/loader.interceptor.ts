// loader.interceptors.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpResponse, HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';
import { map } from 'rxjs/operators';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private requests: HttpRequest<any>[] = [];

  constructor(private loaderService: LoaderService) {}
  removeRequest(req: HttpRequest<any>) {
    const i = this.requests.indexOf(req);

    if (i >= 0) {
      this.requests.splice(i, 1);
    }
    this.loaderService.isLoading.next(this.requests.length > 0);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.requests.push(req);
    // check if you have the parameter 'spinner'
    const spinner = req.params.get('spinner');

    if (spinner && spinner === 'no') {
      // remove parameter
      req.params.delete('spinner');
    } else {
      // Execute interceptor
      this.loaderService.isLoading.next(true);
    }

    // tslint:disable-next-line: deprecation
    return Observable.create((observer) => {
      const subscription = next.handle(req).subscribe(
        (event) => {
          if (event instanceof HttpResponse) {
            console.log('event ', event);

            ['access-token', 'client', 'expiry', 'token-type', 'uid'].forEach((header) => {
              console.log(event.headers.keys());
              const headerValue = event.headers.get(header);

              console.log('headerValue -->', headerValue);

              if (headerValue !== null && localStorage.getItem(header) == null) {
                localStorage.setItem(header, headerValue);
              }
            });

            this.removeRequest(req);
            console.log('req ====> ', req);
            observer.next(event);
            console.log('observer ====> ', observer);
          }
        },
        (err) => {
          this.removeRequest(req);
          observer.error(err);
        },
        () => {
          this.removeRequest(req);
          observer.complete();
        },
      );

      // remove request from queue when cancelled
      return () => {
        this.removeRequest(req);
        subscription.unsubscribe();
      };
    });
  }
}
