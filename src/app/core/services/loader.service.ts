import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  public isLoading = new BehaviorSubject(false);
  static noShowSppiner = { key: 'spinner', value: 'no_show' };

  constructor() {}
}
