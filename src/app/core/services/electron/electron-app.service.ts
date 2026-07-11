import { Injectable } from '@angular/core';

import {
  DESKTOP_COMMAND_CONFIRM_CLOSE,
  DESKTOP_COMMAND_FOCUS_WINDOW,
  DESKTOP_COMMAND_GET_APP_CONFIG,
  DESKTOP_COMMAND_RELOAD_APP,
  DESKTOP_COMMAND_SET_APP_CONFIG,
} from '@electron/shared-electron-angular';

import { ElectronBridgeService } from './electron-bridge.service';

@Injectable({
  providedIn: 'root',
})
export class ElectronAppService {
  constructor(private readonly bridge: ElectronBridgeService) {}

  get isElectron() {
    return this.bridge.isElectron;
  }

  getAppConfig() {
    return this.bridge.invoke(DESKTOP_COMMAND_GET_APP_CONFIG);
  }

  setAppConfig(config: any) {
    return this.bridge.invoke(DESKTOP_COMMAND_SET_APP_CONFIG, config);
  }

  reloadApp() {
    return this.bridge.invoke(DESKTOP_COMMAND_RELOAD_APP);
  }

  focusWindow() {
    return this.bridge.invoke(DESKTOP_COMMAND_FOCUS_WINDOW);
  }

  confirmClose() {
    return this.bridge.invoke(DESKTOP_COMMAND_CONFIRM_CLOSE);
  }
}
