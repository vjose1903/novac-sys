import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { fun } from '../services/functions.service';

@Injectable({
  providedIn: 'root',
})
export class IsLoginGuard implements CanActivate {
  constructor(public router: Router) {}
  canActivate(): boolean {
    const token = fun.getAuthToken();

    if (fun.hasValue(token)) {
      this.router.navigateByUrl('/admin');
      return false;
    } else {
      return true;
    }
  }
}
