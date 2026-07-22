import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, collection, query, where, limit, getDocs, addDoc } from 'firebase/firestore';
import { ConfigI, EmpresaI } from '../src/app/core/interface/config-interface.js';
import { pathAdd, writeLogs } from '../main';
import MachineId from './machine-id.js';
import * as fs from 'fs';
import Functions from './functions.js';
import HandlerConfigFile from './handler-config-file.js';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const GENERAL_CONFIG_COLLECTION = 'general_configuration';
const GENERAL_CONFIG_DOCUMENT_ID = 'app';

const GENERAL_CONFIG_KEYS: Array<keyof ConfigI> = [
  'cliente',
  'nombre_empresa',
  'rnc_empresa',
  'direccion_empresa',
  'telefono_empresa',
  'logo_empresa',
  'logo_impresion',
  'color_app',
  'mode_app',
  'url_servidor',
  'url_servidor_respaldo',
  'config_password',
  'usa_url_principal',
  'usa_facturas_externas',
  'is_produccion',
  'has_contabilidad',
  'calcular_itbis',
  'is_db_local',
  'facturacion_editar_precio',
  'vende_sin_inventario',
  'use_ecf',
  'documentos_a_imprimir',
  'serie_default',
  'medida_producto_terminado',
];

const MACHINE_CONFIG_KEYS: Array<keyof ConfigI> = ['machineId', 'pages_sizes', 'printer_selected'];

export default class FirebaseConfigHandler {
  private static instance: FirebaseConfigHandler;
  private static initPromise: Promise<FirebaseConfigHandler>;
  private firebase: FirebaseApp | null = null;
  private actualClient: string | null = null;
  private db: Firestore | null = null;
  private machineId: string | null = null;
  private isInitialized: boolean = false;
  private readonly empresaCollection: string = 'Empresas';
  private _empresa: EmpresaI;
  private readonly configsCollection: string = 'configuration';
  private handlerConfigFile: HandlerConfigFile;

  private constructor() {}

  static getInstance(machineId: MachineId): Promise<FirebaseConfigHandler> {
    if (!FirebaseConfigHandler.initPromise) {
      FirebaseConfigHandler.initPromise = FirebaseConfigHandler.createInstance(machineId);
    }
    return FirebaseConfigHandler.initPromise;
  }

  private static async createInstance(machineId: MachineId): Promise<FirebaseConfigHandler> {
    if (!FirebaseConfigHandler.instance) {
      FirebaseConfigHandler.instance = new FirebaseConfigHandler();
      await FirebaseConfigHandler.instance.initialize(machineId);
    }
    return FirebaseConfigHandler.instance;
  }

  /**
   * Lee la configuración de Firebase desde el archivo JSON
   */
  private async getFirebaseConfig(): Promise<FirebaseConfig> {
    const pathConfig = (await pathAdd('/fb.config', true)) as string;

    if (!fs.existsSync(pathConfig)) {
      throw new Error('Archivo de configuración de Firebase no encontrado');
    }

    const res = fs.readFileSync(pathConfig, 'utf-8');
    const decript = Functions.desEncriptar(res);

    if (decript.error) {
      throw new Error('Error al desencriptar configuración de Firebase');
    }

    return JSON.parse(decript.object);
  }

  /**
   * Lee el cliente actual
   */
  private async getActualClient(): Promise<string> {
    const pathFile = (await pathAdd('/actual_cliente.json', true)) as string;

    if (!fs.existsSync(pathFile)) {
      throw new Error('Archivo de cliente actual no encontrado');
    }
    const res = fs.readFileSync(pathFile, 'utf-8');

    return JSON.parse(res).name;
  }

  /**
   * Inicializa la conexión a Firebase
   */
  private async initialize(machineId: MachineId): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.machineId = machineId.value;

      // Obtener el cliente actual y configuración de Firebase
      const [actualClient, firebaseConfig] = await Promise.all([this.getActualClient(), this.getFirebaseConfig()]);

      this.actualClient = actualClient;

      // Inicializar Firebase
      this.firebase = initializeApp(firebaseConfig);
      this.db = getFirestore(this.firebase);

      // Inicializar HandlerConfigFile
      this.handlerConfigFile = await HandlerConfigFile.getInstance(machineId);

      // Obtener la empresa actual
      this._empresa = await this.getEmpresa();

      this.isInitialized = true;
    } catch (error) {
      writeLogs(error, 'ERROR al inicializar Firebase Config Handler');

      throw error;
    }
  }

  private createQuery(collectionRef: any, findBy: string, findValue: any, limitCount?: number) {
    let q = query(collectionRef, where(findBy, '==', findValue));
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    return q;
  }

  /**
   * Mapea un documento de Firestore a objeto con ID
   */
  private mapDocumentToObject<T>(docSnapshot: any): T {
    return { ...((docSnapshot.data() as object) || {}), id: docSnapshot.id } as T;
  }

  /**
   * Obtiene la empresa actual desde firebase
   */
  private async getEmpresa(): Promise<EmpresaI> {
    const collectionRef = collection(this.db, this.empresaCollection);
    const q = this.createQuery(collectionRef, 'key', this.actualClient, 1);
    const entitySnapshot = await getDocs(q);

    if (entitySnapshot.empty) {
      throw new Error('Empresa no encontrada en Firebase');
    } else {
      writeLogs('----- Empresa encontrada en Firebase -----');
    }

    const doc = entitySnapshot.docs[0];
    const data = this.mapDocumentToObject<EmpresaI>(doc);

    return data;
  }

  /**
   * Obtiene la colección de configuración actual
   */
  private getCurrentConfigCollection() {
    const stringRef = `${this.empresaCollection}/${this._empresa.id}/${this.configsCollection}`;
    return collection(this.db, stringRef);
  }

  private getGeneralConfigRef() {
    const stringRef = `${this.empresaCollection}/${this._empresa.id}/${GENERAL_CONFIG_COLLECTION}/${GENERAL_CONFIG_DOCUMENT_ID}`;
    return doc(this.db, stringRef);
  }

  /**
   * Obtiene el snapshot de configuración actual
   */
  private async getCurrentConfigSnapShot() {
    const configCollectionRef = this.getCurrentConfigCollection();
    const q = this.createQuery(configCollectionRef, 'machineId', this.machineId, 1);
    return await getDocs(q);
  }

  private pickConfigValues(source: Partial<ConfigI>, keys: Array<keyof ConfigI>): Partial<ConfigI> {
    const result: Partial<ConfigI> = {};

    keys.forEach(key => {
      if (source && source[key] !== undefined) (result as any)[key] = source[key];
    });

    return result;
  }

  private removeUndefinedValues<T extends object>(source: T): T {
    return Object.entries(source).reduce((acc, [key, value]) => {
      if (value !== undefined) (acc as any)[key] = value;
      return acc;
    }, {} as T);
  }

  private makeDefaultGeneralConfig(): Partial<ConfigI> {
    return {
      usa_facturas_externas: false,
      ...this.pickConfigValues(this.handlerConfigFile.default_config, GENERAL_CONFIG_KEYS),
    };
  }

  private makeDefaultMachineConfig(): Partial<ConfigI> {
    return {
      ...this.pickConfigValues(this.handlerConfigFile.default_config, MACHINE_CONFIG_KEYS),
      machineId: this.machineId,
    };
  }

  private mergeConfig(generalConfig: Partial<ConfigI>, machineConfig: Partial<ConfigI>): ConfigI {
    return this.removeUndefinedValues({
      ...this.handlerConfigFile.default_config,
      usa_facturas_externas: false,
      ...generalConfig,
      ...machineConfig,
      machineId: this.machineId,
    }) as ConfigI;
  }

  private hasMissingKeys(source: Partial<ConfigI>, keys: Array<keyof ConfigI>): boolean {
    return keys.some(key => source?.[key] === undefined);
  }

  private hasOnlyKeys(source: Partial<ConfigI>, keys: Array<keyof ConfigI>): boolean {
    const allowedKeys = new Set(keys.map(String));
    return Object.keys(source || {})
      .filter(key => key !== 'id')
      .every(key => allowedKeys.has(key));
  }

  private async getMachineConfig(seedConfig?: Partial<ConfigI>): Promise<{ data: Partial<ConfigI>; legacyData: Partial<ConfigI>; needsSave: boolean; docRef?: any }> {
    const configSnapshot = await this.getCurrentConfigSnapShot();

    if (configSnapshot.empty) {
      const legacyData = seedConfig || this.handlerConfigFile.default_config;
      return {
        data: {
          ...this.makeDefaultMachineConfig(),
          ...this.pickConfigValues(legacyData, MACHINE_CONFIG_KEYS),
          machineId: this.machineId,
        },
        legacyData,
        needsSave: true,
      };
    }

    const docSnapshot = configSnapshot.docs[0];
    const data = this.mapDocumentToObject<ConfigI>(docSnapshot);
    const needsSave = this.hasMissingKeys(data, MACHINE_CONFIG_KEYS) || !this.hasOnlyKeys(data, MACHINE_CONFIG_KEYS);

    return {
      data: {
        ...this.makeDefaultMachineConfig(),
        ...this.pickConfigValues(data, MACHINE_CONFIG_KEYS),
        machineId: this.machineId,
      },
      legacyData: data,
      needsSave,
      docRef: docSnapshot.ref,
    };
  }

  private async upsertMachineConfig(machineConfig: Partial<ConfigI>, docRef?: any): Promise<void> {
    const data = this.removeUndefinedValues({
      ...this.pickConfigValues(machineConfig, MACHINE_CONFIG_KEYS),
      machineId: this.machineId,
    });

    if (docRef) {
      await setDoc(docRef, data);
      return;
    }

    const configCollectionRef = this.getCurrentConfigCollection();
    await addDoc(configCollectionRef, data);
  }

  private async getOrCreateGeneralConfig(legacyConfig: Partial<ConfigI>): Promise<Partial<ConfigI>> {
    const generalConfigRef = this.getGeneralConfigRef();
    const generalSnapshot = await getDoc(generalConfigRef);

    if (generalSnapshot.exists()) {
      const currentGeneralConfig = this.mapDocumentToObject<ConfigI>(generalSnapshot);
      const normalizedGeneralConfig = {
        ...this.makeDefaultGeneralConfig(),
        ...this.pickConfigValues(currentGeneralConfig, GENERAL_CONFIG_KEYS),
      };

      if (this.hasMissingKeys(currentGeneralConfig, GENERAL_CONFIG_KEYS)) {
        await setDoc(generalConfigRef, this.removeUndefinedValues(normalizedGeneralConfig), { merge: true });
      }

      return normalizedGeneralConfig;
    }

    const migratedGeneralConfig = {
      ...this.makeDefaultGeneralConfig(),
      ...this.pickConfigValues(legacyConfig, GENERAL_CONFIG_KEYS),
    };

    await setDoc(generalConfigRef, this.removeUndefinedValues(migratedGeneralConfig), { merge: true });
    writeLogs('----- Configuración general creada en Firebase -----');

    return migratedGeneralConfig;
  }

  /**
   * Obtiene la configuración de la aplicación desde Firestore
   */
  async getAppConfig(seedConfig?: Partial<ConfigI>): Promise<ConfigI> {
    if (!this.isInitialized || !this.db || !this.machineId) {
      throw new Error('Firebase Config Handler no está inicializado');
    }

    try {
      const machineConfigResult = await this.getMachineConfig(seedConfig);
      const generalConfig = await this.getOrCreateGeneralConfig(machineConfigResult.legacyData);

      if (machineConfigResult.needsSave) {
        await this.upsertMachineConfig(machineConfigResult.data, machineConfigResult.docRef);
      }

      writeLogs('----- Configuración mergeada encontrada en Firebase -----');
      return this.mergeConfig(generalConfig, machineConfigResult.data);
    } catch (error) {
      writeLogs(error, 'ERROR al obtener configuración desde Firebase');

      throw error;
    }
  }

  /**
   * Actualiza la configuración en Firestore
   */
  async updateAppConfig(config: ConfigI): Promise<ConfigI> {
    if (!this.isInitialized || !this.db || !this.machineId) {
      throw new Error('Firebase Config Handler no está inicializado');
    }

    try {
      const generalConfig = {
        ...this.makeDefaultGeneralConfig(),
        ...this.pickConfigValues(config, GENERAL_CONFIG_KEYS),
      };
      const machineConfig = {
        ...this.makeDefaultMachineConfig(),
        ...this.pickConfigValues(config, MACHINE_CONFIG_KEYS),
        machineId: this.machineId,
      };

      await setDoc(this.getGeneralConfigRef(), this.removeUndefinedValues(generalConfig), { merge: true });

      const currentMachineConfig = await this.getMachineConfig();
      await this.upsertMachineConfig(machineConfig, currentMachineConfig.docRef);

      return this.mergeConfig(generalConfig, machineConfig);
    } catch (error) {
      writeLogs(error, 'ERROR al actualizar configuración en Firebase');

      throw error;
    }
  }

  /**
   * Desmonta la instancia de Firebase
   */
  async dispose(): Promise<void> {
    try {
      // Limpiar referencias
      this.firebase = null;
      this.db = null;
      this.machineId = null;
      this.isInitialized = false;
      this._empresa = null;
      this.actualClient = null;
      this.handlerConfigFile = null;
    } catch (error) {
      writeLogs(error, 'ERROR al desmontar Firebase Config Handler');
    }
  }

  /**
   * Verifica si la instancia está inicializada
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null && this.actualClient !== null && this._empresa !== null;
  }
}
