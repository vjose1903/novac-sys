import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  canToast: boolean = false;

  constructor() {}

  nextCanToast(nextValue) {
    this.canToast = nextValue;
  }
}
