import { Injectable } from '@angular/core';

import { DESKTOP_COMMAND_OPEN_EXTERNAL } from '@electron/shared-electron-angular';

import { ElectronBridgeService } from './electron-bridge.service';

@Injectable({
  providedIn: 'root',
})
export class ElectronBrowserService {
  constructor(private readonly bridge: ElectronBridgeService) {}

  openExternal(url: string) {
    return this.bridge.invoke(DESKTOP_COMMAND_OPEN_EXTERNAL, { url });
  }
}
