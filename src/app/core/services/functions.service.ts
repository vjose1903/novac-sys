import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FunctionService {
  canToast = false;

  currentUser = null;

  constructor() {}

  nextCanToast(nextValue) {
    this.canToast = nextValue;
  }

  setUser(currentUser) {
    this.currentUser = currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  getAuthToken() {
    return localStorage.getItem('access-token');
  }

  async logout() {
    localStorage.removeItem('access-token');
    localStorage.removeItem('client');
    localStorage.removeItem('content-type');
    localStorage.removeItem('expiry');
    localStorage.removeItem('token-type');
    localStorage.removeItem('uid');

    // this.router.navigateByUrl('/auth/login');
  }
}
