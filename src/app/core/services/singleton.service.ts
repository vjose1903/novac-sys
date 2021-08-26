import { Injectable, NgZone } from '@angular/core';
import { FunctionService } from './functions.service';

@Injectable({
  providedIn: 'root',
})
export class SingletonService {
  public static fun: FunctionService;
  public static zone: NgZone;
  constructor() {}
}
