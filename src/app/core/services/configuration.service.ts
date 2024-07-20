import { Injectable } from '@angular/core';
import { ConfigI } from '../typescript/config-interface';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  constructor() {}

  public static logoEmpresa: string;
  private static config_: ConfigI;

  static set setConfig(configuration) {
    this.config_ = configuration;
  }

  static get config() {
    return this.config_;
  }
}
