import { contextBridge, ipcRenderer } from 'electron';

import type {
  DesktopCommandName,
  DesktopCommandPayloadMap,
  DesktopCommandResponseMap,
  DesktopEventEnvelope,
  DesktopEventListener,
  DesktopInvokeRequest,
} from './shared-electron-angular';

const DESKTOP_INVOKE_CHANNEL = 'desktop:invoke';
const DESKTOP_EVENT_CHANNEL = 'desktop:event';

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
