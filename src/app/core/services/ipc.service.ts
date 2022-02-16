import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import { BehaviorSubject, lastValueFrom, skip, take } from 'rxjs';
import * as fs from 'fs';
import { KEYWORD_ELECTRON_RESPONSE, KEYWORD_ELECTRON_SENDER, MessageTaskInterface } from '../../../../shared-electron-angular';
import { MessageTask } from '../models/message-task';

@Injectable({
  providedIn: 'root',
})
export class IpcService {
  private _ipc: typeof ipcRenderer;
  webFrame: typeof webFrame;

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

  listenEvents() {
    this._ipc.on(KEYWORD_ELECTRON_RESPONSE, (event, obj) => {
      console.log('obj ==> ', obj);

      const arg = typeof obj === 'object' ? (obj as MessageTaskInterface) : (JSON.parse(obj) as MessageTaskInterface);
      const tareas = this.colaDeMensajes.value;

      if (tareas.hasOwnProperty(arg.id)) {
        // console.log(":listenEvents:::ANTES DE EJECUTAR ACCION:::", JSON.stringify(tareas));
        (tareas[arg.id] as MessageTask).fn.next(arg.response);
        tareas[arg.id] = undefined;
        // console.log(":listenEvents:::DESPUES DE EJECUTAR ACCION:::", JSON.stringify(tareas));
        this.updateColaMensaje(tareas);
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
      const lis = this.colaDeMensajes.getValue();
      lis[task.id] = task;
      this.colaDeMensajes.next(lis);
    }
  }
}
