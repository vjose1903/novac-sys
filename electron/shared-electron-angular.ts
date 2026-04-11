export const ELECTRON_TEST = 'electron-test';
export const ELECTRON_TO_ANGULAR = 'electron-to-angular';
export const ELECTRON_SENDER = 'electron-envio';
export const ELECTRON_RESPONSE = 'electron-respuesta';
export const ELECTRON_FOCUS_WINDOW = 'electron-focus-window';
export const ELECTRON_CLOSE_CONFIRMATION = 'electron-close-confirmation';
export const ELECTRON_SHOW_CLOSE_CONFIRMATION = 'electron-show-close-confirmation';
export const ELECTRON_EVENT_DECRYPT = 'electron-desencriptar';
export const ELECTRON_EVENT_ENCRYPT = 'electron-encriptar';
export const ELECTRON_GET_APP_CONFIG = 'electron-get-app-config';
export const ELECTRON_SET_APP_CONFIG = 'electron-set-app-config';
export const ELECTRON_PRINT_BASE64 = 'electron-print-base64';
export const ELECTRON_EXPORT_CSV = 'electron-export-csv';
export const ELECTRON_OPEN_WEB_BROWSER = 'electron-open-web-browser';
export const ELECTRON_RELOAD = 'electron-reload';
export const ELECTRON_EVENT_CHECK_UPDATE = 'check-update';
export const ELECTRON_EVENT_DOWNLOAD_UPDATE = 'download-update';
export const ELECTRON_EVENT_VERIFICATE_UPDATE_AVAILABLE = 'verificate-update-available';
export const ELECTRON_EVENT_UPDATE_CHECKING_FOR_UPDATE = 'checking-for-update';
export const ELECTRON_EVENT_UPDATE_UPDATE_AVAILABLE = 'update-available';
export const ELECTRON_EVENT_UPDATE_DOWNLOAD_PROGRESS = 'download-progress';
export const ELECTRON_EVENT_UPDATE_UPDATE_DOWNLOADED = 'update-downloaded';
export const ELECTRON_EVENT_UPDATE_UPDATE_NOT_AVAILABLE = 'update-not-available';
export const ELECTRON_EVENT_CONFIG_FILE_MODIFIED = 'config-file-modified';
export const ELECTRON_EVENT_UPDATE_ERROR = 'error';
export const ELECTRON_EVENT_UPDATE_BEFORE_QUIT_FOR_UPDATE = 'before-quit-for-update';

export type MetodoHttp = 'get' | 'post' | 'put' | 'delete';
export interface PeticionElectron {
  metodo: MetodoHttp;
  url: string;
  data?: any;
  headers?: any;
}
export interface PeticionElectronResponse {
  status: number;
  response?: any;
}
export interface Printer {
  deviceId: string;
  name: string;
}

export interface MessageTaskInterface {
  id?: string;
  eventName: string;
  data: any;
  response?: any;
  error?: boolean;
}
export interface PrintJob {
  print_width: number;
  left_margin: number;
  name: string;
  printer: Printer;
  data: any[];
}

export default class SharedElectronAngular {
  static sendEventToAngular(win, params: MessageTaskInterface) {
    if (win) win.webContents.send(ELECTRON_RESPONSE, { eventName: params.eventName, data: params.data });
  }
}
