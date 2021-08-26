import { Injectable } from '@angular/core';
import { ipcRenderer, remote, webFrame } from 'electron';
import * as childProcess from 'child_process';
import { BehaviorSubject } from 'rxjs';
import * as fs from 'fs';

@Injectable({
  providedIn: 'root',
})
export class IpcService {
  private _ipc: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;

  private printers = new BehaviorSubject<any>(undefined);
  PRINTERS = this.printers.asObservable();

  objPercent = {
    transferred: 0,
    total: 0,
    percent: 0,
    bytesPerSecond: 0,
  };

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
        this.webFrame = window.require('electron').webFrame;
        // If you wan to use remote object, pleanse set enableRemoteModule to true in main.ts
        // this.remote = window.require('electron').remote;

        this.childProcess = window.require('child_process');
        this.fs = window.require('fs');
      } catch (error) {
        console.error('Electron no se pudo iniciar correctamente');
      }
    }
  }

  require(module: string) {
    return window['require'](module).ipcRenderer;
  }

  PRINTERS_NEW(nextValue) {
    this.printers.next(nextValue);
  }

  public removeListener(channel: string): void {
    if (!this._ipc) return;

    this._ipc.removeAllListeners(channel);
  }

  public on(channel: string, listener: any): void {
    if (!this._ipc) return;

    this._ipc.on(channel, listener);
  }

  public send(channel: string, ...args): void {
    if (!this._ipc) return;

    this._ipc.send(channel, ...args);
  }
}
