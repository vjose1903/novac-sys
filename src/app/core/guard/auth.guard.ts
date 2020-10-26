import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FunctionService } from '../services/functions.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(public router: Router, private fun: FunctionService) {}

  canActivate(): boolean {
    const token = this.fun.getAuthToken();

    if (token === null) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return true;
  }
}
