import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

export const MODALCONFIG = new BehaviorSubject<any>({});

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor() {}
}
