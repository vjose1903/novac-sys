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
import { Environment } from '@environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ElectronUpdateService {
  private readonly stateSubject = new BehaviorSubject<DesktopUpdateState>(createIdleUpdateState());
  private simulatedPreparationTimer: ReturnType<typeof setTimeout> | null = null;
  private simulatedProgressTimer: ReturnType<typeof setInterval> | null = null;
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

  simulateDownload(): void {
    if (Environment.production) return;

    this.clearSimulationTimers();
    const total = 125_000_000;
    const bytesPerSecond = 18_000_000;

    this.stateSubject.next({
      ...this.currentState,
      status: 'downloading',
      source: 'manual',
      progress: null,
      message: 'Preparando descarga...',
      error: null,
    });

    this.simulatedPreparationTimer = setTimeout(() => {
      let percent = 0;

      this.simulatedProgressTimer = setInterval(() => {
        percent = Math.min(percent + 4, 100);

        this.stateSubject.next({
          ...this.currentState,
          status: 'downloading',
          source: 'manual',
          progress: {
            transferred: total * (percent / 100),
            total,
            percent,
            bytesPerSecond,
          },
          message: 'Descargando actualización...',
          error: null,
        });

        if (percent === 100 && this.simulatedProgressTimer) {
          clearInterval(this.simulatedProgressTimer);
          this.simulatedProgressTimer = null;
        }
      }, 150);
    }, 1800);
  }

  private clearSimulationTimers(): void {
    if (this.simulatedPreparationTimer) clearTimeout(this.simulatedPreparationTimer);
    if (this.simulatedProgressTimer) clearInterval(this.simulatedProgressTimer);
    this.simulatedPreparationTimer = null;
    this.simulatedProgressTimer = null;
  }
}
