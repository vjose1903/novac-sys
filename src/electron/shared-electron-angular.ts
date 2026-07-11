export const DESKTOP_INVOKE_CHANNEL = 'desktop:invoke';
export const DESKTOP_EVENT_CHANNEL = 'desktop:event';

export const DESKTOP_COMMAND_GET_APP_CONFIG = 'app:get-config';
export const DESKTOP_COMMAND_SET_APP_CONFIG = 'app:set-config';
export const DESKTOP_COMMAND_RELOAD_APP = 'app:reload';
export const DESKTOP_COMMAND_FOCUS_WINDOW = 'window:focus';
export const DESKTOP_COMMAND_CONFIRM_CLOSE = 'window:confirm-close';
export const DESKTOP_COMMAND_PRINT_BASE64 = 'printer:print-base64';
export const DESKTOP_COMMAND_EXPORT_CSV = 'export:csv';
export const DESKTOP_COMMAND_OPEN_EXTERNAL = 'browser:open-external';
export const DESKTOP_COMMAND_UPDATE_CHECK = 'update:check';
export const DESKTOP_COMMAND_UPDATE_DOWNLOAD = 'update:download';
export const DESKTOP_COMMAND_UPDATE_GET_STATE = 'update:get-state';

export const DESKTOP_EVENT_UPDATE_STATE = 'update:state';
export const DESKTOP_EVENT_APP_CLOSE_REQUESTED = 'app:close-requested';

export type DesktopCommandName =
  | typeof DESKTOP_COMMAND_GET_APP_CONFIG
  | typeof DESKTOP_COMMAND_SET_APP_CONFIG
  | typeof DESKTOP_COMMAND_RELOAD_APP
  | typeof DESKTOP_COMMAND_FOCUS_WINDOW
  | typeof DESKTOP_COMMAND_CONFIRM_CLOSE
  | typeof DESKTOP_COMMAND_PRINT_BASE64
  | typeof DESKTOP_COMMAND_EXPORT_CSV
  | typeof DESKTOP_COMMAND_OPEN_EXTERNAL
  | typeof DESKTOP_COMMAND_UPDATE_CHECK
  | typeof DESKTOP_COMMAND_UPDATE_DOWNLOAD
  | typeof DESKTOP_COMMAND_UPDATE_GET_STATE;

export type DesktopEventName = typeof DESKTOP_EVENT_UPDATE_STATE | typeof DESKTOP_EVENT_APP_CLOSE_REQUESTED;

export interface DesktopCommandPayloadMap {
  [DESKTOP_COMMAND_GET_APP_CONFIG]: undefined;
  [DESKTOP_COMMAND_SET_APP_CONFIG]: any;
  [DESKTOP_COMMAND_RELOAD_APP]: undefined;
  [DESKTOP_COMMAND_FOCUS_WINDOW]: undefined;
  [DESKTOP_COMMAND_CONFIRM_CLOSE]: undefined;
  [DESKTOP_COMMAND_PRINT_BASE64]: { base64: string; file: string; type: string; printer: string; pageOrientation: string };
  [DESKTOP_COMMAND_EXPORT_CSV]: { fileName: string; excelData: Array<string[]>; configuration: any };
  [DESKTOP_COMMAND_OPEN_EXTERNAL]: { url: string };
  [DESKTOP_COMMAND_UPDATE_CHECK]: { source?: DesktopUpdateCheckSource } | undefined;
  [DESKTOP_COMMAND_UPDATE_DOWNLOAD]: undefined;
  [DESKTOP_COMMAND_UPDATE_GET_STATE]: undefined;
}

export interface DesktopCommandResponseMap {
  [DESKTOP_COMMAND_GET_APP_CONFIG]: any;
  [DESKTOP_COMMAND_SET_APP_CONFIG]: 'LISTO';
  [DESKTOP_COMMAND_RELOAD_APP]: void;
  [DESKTOP_COMMAND_FOCUS_WINDOW]: { ok: true };
  [DESKTOP_COMMAND_CONFIRM_CLOSE]: { ok: true };
  [DESKTOP_COMMAND_PRINT_BASE64]: any;
  [DESKTOP_COMMAND_EXPORT_CSV]: any;
  [DESKTOP_COMMAND_OPEN_EXTERNAL]: { ok: true };
  [DESKTOP_COMMAND_UPDATE_CHECK]: DesktopUpdateState;
  [DESKTOP_COMMAND_UPDATE_DOWNLOAD]: { started: boolean; status: DesktopUpdateStatus; message: string };
  [DESKTOP_COMMAND_UPDATE_GET_STATE]: DesktopUpdateState;
}

export interface DesktopInvokeRequest<TCommand extends DesktopCommandName = DesktopCommandName> {
  command: TCommand;
  payload: DesktopCommandPayloadMap[TCommand];
}

export interface DesktopEventPayloadMap {
  [DESKTOP_EVENT_UPDATE_STATE]: DesktopUpdateState;
  [DESKTOP_EVENT_APP_CLOSE_REQUESTED]: { reason: 'user-request' };
}

export interface DesktopEventEnvelope<TEvent extends DesktopEventName = DesktopEventName> {
  eventName: TEvent;
  payload: DesktopEventPayloadMap[TEvent];
}

export type DesktopUpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'installing' | 'error';
export type DesktopUpdateCheckSource = 'auto' | 'manual';

export interface DesktopUpdateProgress {
  transferred: number;
  total: number;
  percent: number;
  bytesPerSecond: number;
}

export interface DesktopUpdateState {
  status: DesktopUpdateStatus;
  source: DesktopUpdateCheckSource | null;
  updateInfo?: any;
  progress?: DesktopUpdateProgress | null;
  message?: string;
  checkedAt?: string | null;
  error?: { message: string; stack?: string | null } | null;
}

export type DesktopEventListener = (event: DesktopEventEnvelope) => void;

type DesktopEventWindow = {
  isDestroyed(): boolean;
  webContents: {
    send(channel: string, event: DesktopEventEnvelope): void;
  };
};

export function createIdleUpdateState(): DesktopUpdateState {
  return {
    status: 'idle',
    source: null,
    progress: null,
    checkedAt: null,
    error: null,
    message: 'Updater idle',
  };
}

export function sendDesktopEvent(
  win: DesktopEventWindow | null | undefined,
  event: DesktopEventEnvelope
) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send(DESKTOP_EVENT_CHANNEL, event);
}
