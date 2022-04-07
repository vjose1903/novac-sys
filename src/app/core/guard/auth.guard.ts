import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { fun } from '../services/functions.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(public router: Router) {}

  canActivate(): boolean {
    const token = fun.getAuthToken();

    if (token === null) {
      fun.logout();
      setTimeout(() => this.router.navigateByUrl('/auth/login'), 250);
      return false;
    }

    return true;
  }
}
