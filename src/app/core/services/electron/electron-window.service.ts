import { Injectable } from '@angular/core';

import { DESKTOP_EVENT_APP_CLOSE_REQUESTED } from '@electron/shared-electron-angular';

import { ElectronAppService } from './electron-app.service';
import { ElectronBridgeService } from './electron-bridge.service';

@Injectable({
  providedIn: 'root',
})
export class ElectronWindowService {
  readonly closeRequested$;

  constructor(
    private readonly bridge: ElectronBridgeService,
    private readonly appService: ElectronAppService
  ) {
    this.closeRequested$ = this.bridge.onEvent(DESKTOP_EVENT_APP_CLOSE_REQUESTED);
  }

  focusWindow() {
    return this.appService.focusWindow();
  }

  confirmClose() {
    return this.appService.confirmClose();
  }
}
