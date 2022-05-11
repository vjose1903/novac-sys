import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

export const MODALCONFIG = new BehaviorSubject<any>({});

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  modalsConfig = [];
  constructor() {}

  isModalOpen(type: 'least_one') {
    let res = false;

    if (type == 'least_one') res = this.modalsConfig.length >= 1;
    return res;
  }
}
