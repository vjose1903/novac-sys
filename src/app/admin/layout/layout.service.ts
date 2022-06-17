import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  CHECKCUADRETODAY = new BehaviorSubject<any>(false);
  LOGOUT = new BehaviorSubject<any>({ bool: false });

  constructor() {}

  nextLogOut(nextValue) {
    console.log('nextLogOut: ', nextValue);
    this.LOGOUT.next(nextValue);
  }

  nextCheckCuadreToday(nextValue) {
    this.CHECKCUADRETODAY.next(nextValue);
  }
}
