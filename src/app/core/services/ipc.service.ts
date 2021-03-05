import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class IpcService {
  private _ipc: IpcRenderer | undefined;
  private printers = new BehaviorSubject<any>(undefined);
  PRINTERS = this.printers.asObservable();

  objPercent = {
    transferred: 0,
    total: 0,
    percent: 0,
    bytesPerSecond: 0,
  };

  constructor() {
    if (window.require) {
      try {
        // this._ipc = this.require('electron');
        // this._ipc = window.require('electron').ipcRenderer;
        this._ipc = (<any>window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn("Electron's IPC was not loaded");
    }
  }

  require(module: string) {
    return window['require'](module).ipcRenderer;
  }

  PRINTERS_NEW(nextValue) {
    this.printers.next(nextValue);
  }

  public removeListener(channel: string): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.removeAllListeners(channel);
  }

  public on(channel: string, listener: any): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.on(channel, listener);
  }

  public send(channel: string, ...args): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.send(channel, ...args);
  }
}
