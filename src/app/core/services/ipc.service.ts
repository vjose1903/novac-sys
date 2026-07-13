import { Injectable } from '@angular/core';

import { ElectronAppService } from './electron/electron-app.service';
import { ElectronBrowserService } from './electron/electron-browser.service';
import { ElectronBridgeService } from './electron/electron-bridge.service';
import { ElectronDocumentsService } from './electron/electron-documents.service';
import { ElectronUpdateService } from './electron/electron-update.service';
import { ElectronWindowService } from './electron/electron-window.service';

@Injectable({
  providedIn: 'root',
})
export class IpcService {
  constructor(
    public readonly bridge: ElectronBridgeService,
    public readonly app: ElectronAppService,
    public readonly browser: ElectronBrowserService,
    public readonly documents: ElectronDocumentsService,
    public readonly update: ElectronUpdateService,
    public readonly window: ElectronWindowService
  ) {}

  get isElectron(): boolean {
    return this.bridge.isElectron;
  }

  get closeRequested$() {
    return this.window.closeRequested$;
  }

  get updateState$() {
    return this.update.state$;
  }

  get updateState() {
    return this.update.currentState;
  }

  getAppConfig() {
    return this.app.getAppConfig();
  }

  setAppConfig(config: any) {
    return this.app.setAppConfig(config);
  }

  reloadApp() {
    return this.app.reloadApp();
  }

  focusWindow() {
    return this.window.focusWindow();
  }

  confirmClose() {
    return this.window.confirmClose();
  }

  printBase64(payload: { base64: string; file: string; type: string; printer: string; pageOrientation: string }) {
    return this.documents.printBase64(payload);
  }

  exportCsv(payload: { fileName: string; excelData: Array<string[]>; configuration: any }) {
    return this.documents.exportCsv(payload);
  }

  openExternal(url: string) {
    return this.browser.openExternal(url);
  }

  checkForUpdates() {
    return this.update.checkForUpdates('manual');
  }

  downloadUpdate() {
    return this.update.downloadUpdate();
  }

  simulateUpdateDownload() {
    this.update.simulateDownload();
  }

  refreshUpdateState() {
    return this.update.refreshState();
  }
}
