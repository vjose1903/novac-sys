import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';
import { IModalConfiguration } from './modal-class';
export const modalsConfigurations = new BehaviorSubject<IModalConfiguration>({});


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

  findModalConfigById(modalId: string): IModalConfiguration {
    const modal: IModalConfiguration = this.modalsConfig.find((config: IModalConfiguration) => config.id == modalId) ?? {};
    return modal;
  }
}
