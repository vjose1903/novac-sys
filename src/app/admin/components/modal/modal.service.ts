import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';
import { ConfigureModalI } from './modal-class';
export const modalsConfigurations = new BehaviorSubject<ConfigureModalI>({});

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor() {}
  modalsConfig = [];

  isModalOpen(type: 'least_one') {
    let res = false;

    if (type == 'least_one') res = this.modalsConfig.length >= 1;
    return res;
  }

  findModalConfigById(modalId: string): ConfigureModalI {
    const modal: ConfigureModalI = this.modalsConfig.find((config: ConfigureModalI) => config.id == modalId) ?? {};
    return modal;
  }
}
