import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import { BehaviorSubject, lastValueFrom, skip, take } from 'rxjs';
import * as fs from 'fs';
import { KEYWORD_ELECTRON_RESPONSE, KEYWORD_ELECTRON_SENDER, MessageTaskInterface } from '../../../../electron/shared-electron-angular';
import { MessageTask } from '../typescript/message-task';
import { ELECTRON_EVENTS_OBSERVER } from '../typescript/GLOBAL';

@Injectable({
  providedIn: 'root',
})
export class IpcService {
  private _ipc: typeof ipcRenderer;
  webFrame: typeof webFrame;

  childProcess: typeof childProcess;
  fs: typeof fs;

  objPercent = {
    transferred: 0,
    total: 0,
    percent: 0,
    bytesPerSecond: 0,
  };

  colaDeMensajes = new BehaviorSubject<any>({});

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
        this.webFrame = window.require('electron').webFrame;

        this.childProcess = window.require('child_process');
        this.fs = window.require('fs');
        this.listenEvents();
      } catch (error) {
        console.error('Electron no se pudo iniciar correctamente');
      }
    }
  }

  require(module: string) {
    return window['require'](module).ipcRenderer;
  }

  public removeListener(channel: string): void {
    if (!this._ipc) return;
    this._ipc.removeAllListeners(channel);
  }

  public on(channel: string, listener: any): void {
    if (!this._ipc) return;
    this._ipc.on(channel, listener);
  }

  listenEvents() {
    this._ipc.on(KEYWORD_ELECTRON_RESPONSE, (event, obj) => {
      const arg = typeof obj === 'object' ? (obj as MessageTaskInterface) : (JSON.parse(obj) as MessageTaskInterface);
      const tareas = this.colaDeMensajes.value;

      if (tareas.hasOwnProperty(arg.id)) {
        (tareas[arg.id] as MessageTask).fn.next(arg.response);
        tareas[arg.id] = undefined;
        this.updateColaMensaje(tareas);
      } else {
        ELECTRON_EVENTS_OBSERVER.next(obj);
      }
    });
  }

  sendTask(task: MessageTask) {
    return new Promise(async (resolve, reject) => {
      if (this.isElectron) {
        this.addColaMensaje(task);
        this.trigger(task.serialize());

        try {
          const resultado = await lastValueFrom(task.fn.pipe(skip(1), take(1)));

          resolve(resultado);
        } catch (error) {
          reject(error);
        }
      } else {
        reject({ error: true });
      }
    });
  }

  private trigger(arg: any) {
    if (this.isElectron) {
      this._ipc.send(KEYWORD_ELECTRON_SENDER, arg);
    }
  }

  private updateColaMensaje(lis) {
    if (this.isElectron) this.colaDeMensajes.next(lis);
  }

  private addColaMensaje(task: MessageTask) {
    if (this.isElectron) {
      const list = this.colaDeMensajes.getValue();
      list[task.id] = task;
      this.colaDeMensajes.next(list);
    }
  }
}
