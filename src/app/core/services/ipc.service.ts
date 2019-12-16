import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class IpcService {
  private _ipc: IpcRenderer | undefined;
  private printers = new BehaviorSubject<any>(undefined)
  PRINTERS = this.printers.asObservable();


 

  constructor() {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('Electron\'s IPC was not loaded');
    } }

    
    PRINTERS_NEW(nextValue) {
      this.printers.next(nextValue);
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
