import { Injectable, NgZone, inject } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import { BehaviorSubject, filter, lastValueFrom, skip, take } from 'rxjs';
import * as fs from 'fs';
import { ELECTRON_FOCUS_WINDOW, ELECTRON_RESPONSE, ELECTRON_SENDER, MessageTaskInterface } from '../../../../electron/shared-electron-angular';
import { MessageTask } from '../models/message-task';
import { fun } from './functions.service';

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

  // Añadir nuevo Subject para eventos
  private electronEvents = new BehaviorSubject<MessageTaskInterface>(null);
  public electronEvents$ = this.electronEvents.asObservable();

  private ngZone = inject(NgZone);

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
    this._ipc.on(ELECTRON_RESPONSE, (event, obj) => {
      // Ejecutar dentro de la zona de Angular para detectar cambios
      this.ngZone.run(() => {
        const arg = obj ? (typeof obj === 'object' ? (obj as MessageTaskInterface) : (JSON.parse(obj) as MessageTaskInterface)) : {} as MessageTaskInterface;
        const tareas = this.colaDeMensajes.value;

        if (tareas.hasOwnProperty(arg.id)) {
          (tareas[arg.id] as MessageTask).fn.next(arg);
          tareas[arg.id] = undefined;
          this.updateColaMensaje(tareas);
        } else {
          this.electronEvents.next(obj);
        }
      });
    });
  }

  sendTask(task: MessageTask) {
    return new Promise<MessageTaskInterface>(async (resolve, reject) => {
      if (this.isElectron) {
        this.addColaMensaje(task);
        this.trigger(task.serialize());

        try {
          const taskResult = await lastValueFrom(task.fn.pipe(skip(1), take(1)));
          
          // Ejecutar resolución dentro de la zona de Angular
          this.ngZone.run(() => {
            if (taskResult.error == false || !('error' in taskResult) || fun.isEmpty(taskResult?.error)) {
              resolve(taskResult.response);
            } else {
              reject(taskResult.response);
            }
          });
        } catch (error) {
          this.ngZone.run(() => reject(error));
        }
      } else {
        reject({ error: true });
      }
    });
  }

  private trigger(arg: any) {
    if (this.isElectron) {
      this._ipc.send(ELECTRON_SENDER, arg);
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

  // Añadir método helper para escuchar eventos específicos
  public onElectronEvent(eventName: string) {
    return this.electronEvents$.pipe(
      filter((event: MessageTaskInterface) => event?.eventName === eventName)
    );
  }

  // Añade este método para solicitar focus
  public focusWindow(): void {
    if (this.isElectron) {
      this.sendTask(new MessageTask(ELECTRON_FOCUS_WINDOW, {}));
    }
  }
}
