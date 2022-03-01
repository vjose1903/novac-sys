import { Injectable } from '@angular/core';
import { ConfigI } from '../typescript/config-interface';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  constructor() {}

  private config: ConfigI;

  set setConfig(configuration) {
    this.config = configuration;
  }

  getConfig(params: { isPromise: boolean } = { isPromise: true }): any {
    if (params.isPromise) {
      return new Promise((resolve) => {
        resolve(this.config as ConfigI);
      });
    } else {
      return this.config as ConfigI;
    }
  }
}
