import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FunctionService {
  currentUser = null;

  constructor() {}

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
