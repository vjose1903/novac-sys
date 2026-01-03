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

  /**
   * Obtiene el snapshot de configuración actual
   */
  private async getCurrentConfigSnapShot() {
    const configCollectionRef = this.getCurrentConfigCollection();
    const q = this.createQuery(configCollectionRef, 'machineId', this.machineId, 1);
    return await getDocs(q);
  }

  /**
   * Obtiene la configuración de la aplicación desde Firestore
   */
  async getAppConfig(): Promise<ConfigI> {
    if (!this.isInitialized || !this.db || !this.machineId) {
      throw new Error('Firebase Config Handler no está inicializado');
    }

    try {
      const configSnapshot = await this.getCurrentConfigSnapShot();

      if (!configSnapshot.empty) {
        writeLogs('----- Configuración encontrada en Firebase -----');
        const doc = configSnapshot.docs[0];
        const data = this.mapDocumentToObject<ConfigI>(doc);

        return data;
      } else {
        writeLogs('----- Configuración no encontrada en Firebase, creando nueva -----');
        const defaultConfig = { ...this.handlerConfigFile.default_config };
        delete defaultConfig.id;

        return await this.updateAppConfig(defaultConfig);
      }
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
      const configSnapshot = await this.getCurrentConfigSnapShot();

      let docRef;
      if (!configSnapshot.empty) {
        // Actualizar documento existente
        docRef = configSnapshot.docs[0].ref;
        await setDoc(docRef, config, { merge: true });
      } else {
        // Crear nuevo documento
        const configCollectionRef = this.getCurrentConfigCollection();
        docRef = await addDoc(configCollectionRef, config);
      }

      // Obtener el documento actualizado/creado
      const docSnapshot = await getDoc(docRef);
      const config_response = this.mapDocumentToObject<ConfigI>(docSnapshot);

      return config_response;
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
