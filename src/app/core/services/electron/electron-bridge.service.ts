import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';

import {
  DesktopCommandName,
  DesktopCommandPayloadMap,
  DesktopCommandResponseMap,
  DesktopEventEnvelope,
  DesktopEventName,
  DesktopEventPayloadMap,
} from '@electron/shared-electron-angular';

@Injectable({
  providedIn: 'root',
})
export class ElectronBridgeService {
  private readonly eventsSubject = new Subject<DesktopEventEnvelope>();
  private unsubscribeEvents: (() => void) | null = null;

  constructor(private readonly ngZone: NgZone) {
    if (this.isElectron) {
      this.unsubscribeEvents = window.electronAPI.onEvent(event => {
        this.ngZone.run(() => this.eventsSubject.next(event));
      });
    }
  }

  get isElectron(): boolean {
    return typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';
  }

  get events$(): Observable<DesktopEventEnvelope> {
    return this.eventsSubject.asObservable();
  }

  invoke<TCommand extends DesktopCommandName>(command: TCommand, payload?: DesktopCommandPayloadMap[TCommand]) {
    if (!this.isElectron) {
      return Promise.reject(new Error(`Electron API no disponible para el comando ${command}`)) as Promise<DesktopCommandResponseMap[TCommand]>;
    }

    return window.electronAPI.invoke(command, payload) as Promise<DesktopCommandResponseMap[TCommand]>;
  }

  onEvent<TEvent extends DesktopEventName>(eventName: TEvent) {
    return this.events$.pipe(
      filter(event => event.eventName === eventName),
      map(event => event.payload as DesktopEventPayloadMap[TEvent])
    );
  }
}
