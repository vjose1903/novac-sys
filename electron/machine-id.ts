import { machineId } from 'node-machine-id';

export default class MachineId {
  private static instance: MachineId;
  value: string;

  private constructor() {}

  // Singleton para garantizar una única instancia
  public static getInstance(): MachineId {
    if (!MachineId.instance) {
      MachineId.instance = new MachineId();
      MachineId.instance.initVars();
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
