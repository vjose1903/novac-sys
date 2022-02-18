export const KEYWORD_ELECTRON_SENDER = 'electron-envio';
export const KEYWORD_ELECTRON_RESPONSE = 'electron-respuesta';
export const KEYWORD_ELECTRON_EVENT_DECRYPT = 'electron-desencriptar';
export const KEYWORD_ELECTRON_EVENT_ENCRYPT = 'electron-encriptar';
export const KEYWORD_ELECTRON_GET_APP_CONFIG = 'electron-get-app-config';
export const KEYWORD_ELECTRON_SET_APP_CONFIG = 'electron-set-app-config';
export const KEYWORD_ELECTRON_PRINT_BASE64 = 'electron-print-base64';

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
  id: string;
  eventName: string;
  data: any;
  response: any;
}
export interface PrintJob {
  print_width: number;
  left_margin: number;
  name: string;
  printer: Printer;
  data: any[];
}
