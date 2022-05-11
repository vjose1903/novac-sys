import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  CHECKCUADRETODAY = new BehaviorSubject<any>(false);
  LOGOUT = new BehaviorSubject<any>(false);

  constructor() {}

  nextLogOut(nextValue) {
    console.log(' ');
    console.log('============== nextLogOut ===============');
    console.log(' ');

    this.LOGOUT.next(nextValue);
  }

  nextCheckCuadreToday(nextValue) {
    this.CHECKCUADRETODAY.next(nextValue);
  }
}
