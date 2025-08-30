import { machineId } from 'node-machine-id';

export default class MachineId {
  private static instance: MachineId;
  private static initPromise: Promise<MachineId>;
  value: string;

  private constructor() {}

  // Singleton para garantizar una única instancia
  public static getInstance(): Promise<MachineId> {
    if (!MachineId.initPromise) {
      MachineId.initPromise = MachineId.createInstance();
    }
    return MachineId.initPromise;
  }

  private static async createInstance(): Promise<MachineId> {
    if (!MachineId.instance) {
      MachineId.instance = new MachineId();
      await MachineId.instance.initVars();
    }
    return MachineId.instance;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // MÉTODO PARA INICIALIZAR LAS VARIABLES
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  private async initVars() {
    this.value = await machineId();
  }
}
