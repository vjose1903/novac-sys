import { Injectable } from '@angular/core';

import { DESKTOP_COMMAND_EXPORT_CSV, DESKTOP_COMMAND_PRINT_BASE64 } from '@electron/shared-electron-angular';

import { ElectronBridgeService } from './electron-bridge.service';

@Injectable({
  providedIn: 'root',
})
export class ElectronDocumentsService {
  constructor(private readonly bridge: ElectronBridgeService) {}

  printBase64(payload: { base64: string; file: string; type: string; printer: string; pageOrientation: string }) {
    return this.bridge.invoke(DESKTOP_COMMAND_PRINT_BASE64, payload);
  }

  exportCsv(payload: { fileName: string; excelData: Array<string[]>; configuration: any }) {
    return this.bridge.invoke(DESKTOP_COMMAND_EXPORT_CSV, payload);
  }
}
