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

    if (token !== null) {
      this.router.navigate(['/admin']);
      return false;
    }

    return true;
  }
}
