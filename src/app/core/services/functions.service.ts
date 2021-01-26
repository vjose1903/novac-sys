import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FunctionService {
  canToast = false;

  currentUser = null;

  // constructor() {}

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

  async logout(callback = (arg) => {}) {
    try {
      callback(true);
    } catch (error) {
      callback(false);
    }

    // this.router.navigateByUrl('/auth/login');
  }
}
