import { contextBridge, ipcRenderer } from 'electron';

import {
  DESKTOP_EVENT_CHANNEL,
  DESKTOP_INVOKE_CHANNEL,
  DesktopCommandName,
  DesktopCommandPayloadMap,
  DesktopCommandResponseMap,
  DesktopEventEnvelope,
  DesktopEventListener,
  DesktopInvokeRequest,
} from './shared-electron-angular';

const desktopApi = {
  invoke<TCommand extends DesktopCommandName>(command: TCommand, payload?: DesktopCommandPayloadMap[TCommand]) {
    const request: DesktopInvokeRequest<TCommand> = {
      command,
      payload: (payload ?? undefined) as DesktopCommandPayloadMap[TCommand],
    };

    return ipcRenderer.invoke(DESKTOP_INVOKE_CHANNEL, request) as Promise<DesktopCommandResponseMap[TCommand]>;
  },
  onEvent(listener: DesktopEventListener) {
    const handler = (_event: Electron.IpcRendererEvent, envelope: DesktopEventEnvelope) => listener(envelope);
    ipcRenderer.on(DESKTOP_EVENT_CHANNEL, handler);

    return () => {
      ipcRenderer.removeListener(DESKTOP_EVENT_CHANNEL, handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', desktopApi);
