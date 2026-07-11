import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  createIdleUpdateState,
  DESKTOP_COMMAND_UPDATE_CHECK,
  DESKTOP_COMMAND_UPDATE_DOWNLOAD,
  DESKTOP_COMMAND_UPDATE_GET_STATE,
  DESKTOP_EVENT_UPDATE_STATE,
  DesktopUpdateCheckSource,
  DesktopUpdateState,
} from '@electron/shared-electron-angular';

import { ElectronBridgeService } from './electron-bridge.service';

@Injectable({
  providedIn: 'root',
})
export class ElectronUpdateService {
  private readonly stateSubject = new BehaviorSubject<DesktopUpdateState>(createIdleUpdateState());
  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly bridge: ElectronBridgeService) {
    if (this.bridge.isElectron) {
      this.bridge.onEvent(DESKTOP_EVENT_UPDATE_STATE).subscribe(state => {
        this.stateSubject.next(state);
      });

      this.refreshState().catch(() => undefined);
    }
  }

  get currentState() {
    return this.stateSubject.value;
  }

  async refreshState() {
    const state = await this.bridge.invoke(DESKTOP_COMMAND_UPDATE_GET_STATE);
    this.stateSubject.next(state);
    return state;
  }

  async checkForUpdates(source: DesktopUpdateCheckSource = 'manual') {
    const state = await this.bridge.invoke(DESKTOP_COMMAND_UPDATE_CHECK, { source });
    this.stateSubject.next(state);
    return state;
  }

  downloadUpdate() {
    return this.bridge.invoke(DESKTOP_COMMAND_UPDATE_DOWNLOAD);
  }
}
