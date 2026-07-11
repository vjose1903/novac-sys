import { DesktopCommandName, DesktopCommandPayloadMap, DesktopCommandResponseMap, DesktopEventEnvelope, DesktopEventListener } from '../electron/shared-electron-angular';

declare var nodeModule: NodeModule;
interface NodeModule {
  id: string;
}

declare global {
  interface Window {
    electronAPI?: {
      invoke<TCommand extends DesktopCommandName>(command: TCommand, payload?: DesktopCommandPayloadMap[TCommand]): Promise<DesktopCommandResponseMap[TCommand]>;
      onEvent(listener: DesktopEventListener): () => void;
    };
  }
}

export {};
