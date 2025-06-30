import { addDoc, collection, doc, getDoc, getDocs, updateDoc, query, where, limit, DocumentReference } from '@angular/fire/firestore';
import { Ss } from '../services/singleton.service';
import { fun } from '@core/services/functions.service';
import { runInInjectionContext, Injector, inject } from '@angular/core';

export class FirebaseRequest<T> {
  private _firebaseCollectionName!: string;
  private injector = inject(Injector);
  private resolvedRefs = new Map<string, any>(); // Cache para referencias ya resueltas

  set firebaseCollectionName(value: string) {
    this._firebaseCollectionName = value;
  }

  // ========== MÉTODOS DE VALIDACIÓN ==========
  private async validateParams(
    params: referenceParams | CreateInParentParams | UpdateInParentParams,
    type: 'getAll' | 'getOne' | 'create' | 'update' | 'createInParent' | 'updateInParent'
  ): Promise<referenceParams | CreateInParentParams | UpdateInParentParams> {
    if (fun.isEmpty(params)) params = {};

    // Validación específica para createInParent
    if (type === 'createInParent') {
      const createParams = params as CreateInParentParams;
      if (fun.isEmpty(createParams.parentCollection)) throw new Error('parentCollection is required');
      if (fun.isEmpty(createParams.parentId)) throw new Error('parentId is required');
      if (fun.isEmpty(createParams.data)) throw new Error('data is required');
      return createParams;
    }

    // Validación específica para updateInParent
    if (type === 'updateInParent') {
      const updateParams = params as UpdateInParentParams;
      if (fun.isEmpty(updateParams.parentCollection)) throw new Error('parentCollection is required');
      if (fun.isEmpty(updateParams.parentId)) throw new Error('parentId is required');
      if (fun.isEmpty(updateParams.documentId)) throw new Error('documentId is required');
      if (fun.isEmpty(updateParams.data)) throw new Error('data is required');
      return updateParams;
    }

    // Validaciones para otros tipos
    const refParams = params as referenceParams;
    if (fun.isEmpty(refParams.find_by)) refParams.find_by = 'id';

    const findValueRequired = ['getOne', 'update'];
    if (fun.isEmpty(refParams.find_value) && findValueRequired.includes(type)) {
      throw new Error('find_value is required');
    }

    return refParams;
  }

  // ========== MÉTODOS HELPER ==========
  private async mapDocumentToObject(docSnapshot: any): Promise<T> {
    const data = { ...((docSnapshot.data() as object) || {}), id: docSnapshot.id };
    return (await this.resolveDocumentReferences(data)) as T;
  }

  private async mapDocumentsToArray(docs: any[]): Promise<T[]> {
    return Promise.all(docs.map(doc => this.mapDocumentToObject(doc)));
  }

  private async resolveDocumentReferences(data: any): Promise<any> {
    if (!data || typeof data !== 'object') return data;

    // Si es un array, procesar cada elemento
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.resolveDocumentReferences(item)));
    }

    const resolvedData = { ...data };

    // Procesar todas las propiedades en paralelo
    const promises = Object.entries(data).map(async ([key, value]) => {
      if (this.isDocumentReference(value)) {
        try {
          const resolvedValue = await this.resolveDocumentReference(value as DocumentReference);
          return [key, resolvedValue];
        } catch (error) {
          console.warn(`Error resolving document reference for key ${key}:`, error);
          return [key, value]; // Mantener la referencia original
        }
      } else if (typeof value === 'object' && value !== null) {
        const resolvedValue = await this.resolveDocumentReferences(value);
        return [key, resolvedValue];
      }
      return [key, value];
    });

    const results = await Promise.all(promises);
    results.forEach(([key, value]) => {
      resolvedData[key] = value;
    });

    return resolvedData;
  }

  private isDocumentReference(value: any): boolean {
    return value && typeof value === 'object' && 'path' in value && 'id' in value && 'parent' in value && typeof value.path === 'string' && value.path.includes('/');
  }

  private async resolveDocumentReference(docRef: DocumentReference): Promise<any> {
    const refKey = docRef.path;

    // Verificar cache primero
    if (this.resolvedRefs.has(refKey)) {
      return this.resolvedRefs.get(refKey);
    }

    return runInInjectionContext(this.injector, async () => {
      try {
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          const data = { ...((docSnapshot.data() as object) || {}), id: docSnapshot.id };
          const resolvedData = await this.resolveDocumentReferences(data);

          // Guardar en cache
          this.resolvedRefs.set(refKey, resolvedData);
          return resolvedData;
        }
        return null;
      } catch (error) {
        console.warn(`Error resolving document reference ${refKey}:`, error);
        return null;
      }
    });
  }

  private makeEntityRefString(params: Partial<referenceParams> = {}): string {
    let refString = `${this._firebaseCollectionName}`;

    if (params.find_value) refString += `/${params.find_value}`;
    if (params.subEntity) refString += `/${params.subEntity}`;
    if (params.subEntityId) refString += `/${params.subEntityId}`;

    return refString;
  }

  private firebaseQuery(collectionRef: any, findBy: string, findValue: any, limitCount?: number) {
    let q = query(collectionRef, where(findBy, '==', findValue));
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    return q;
  }

  // ========== MÉTODOS PARA OBTENER POR ID ==========
  private async getDocumentById(refString: string): Promise<T | null> {
    return runInInjectionContext(this.injector, async () => {
      const entityRef = doc(Ss.firestore, refString);
      const entitySnapshot = await getDoc(entityRef);

      if (!entitySnapshot.exists()) {
        return null;
      }

      return await this.mapDocumentToObject(entitySnapshot);
    });
  }

  // ========== MÉTODOS PARA OBTENER POR CAMPO ==========
  private async getDocumentByField(collectionPath: string, fieldName: string, fieldValue: any): Promise<T | null> {
    return runInInjectionContext(this.injector, async () => {
      const entityRef = collection(Ss.firestore, collectionPath);
      const q = this.firebaseQuery(entityRef, fieldName, fieldValue, 1);
      const entitySnapshot = await getDocs(q);

      if (entitySnapshot.empty) {
        return null;
      }

      return await this.mapDocumentToObject(entitySnapshot.docs[0]);
    });
  }

  private async getDocumentsByField(collectionPath: string, fieldName?: string, fieldValue?: any): Promise<T[]> {
    return runInInjectionContext(this.injector, async () => {
      const entityRef = collection(Ss.firestore, collectionPath);

      let q;
      if (fieldName && fieldValue !== undefined) {
        q = this.firebaseQuery(entityRef, fieldName, fieldValue);
      } else {
        q = entityRef;
      }

      const entitySnapshot = await getDocs(q);
      return await this.mapDocumentsToArray(entitySnapshot.docs);
    });
  }

  // ========== MÉTODOS PÚBLICOS PRINCIPALES ==========
  async _getAll(params: referenceParams = {}): Promise<T[]> {
    try {
      params = await this.validateParams(params, 'getAll');
      const refString = this.makeEntityRefString(params);
      return await this.getDocumentsByField(refString);
    } catch (error) {
      return [];
    }
  }

  async _getOne(params: referenceParams): Promise<T | null> {
    try {
      params = await this.validateParams(params, 'getOne');

      // Buscar por ID del documento
      if (!params.find_by || params.find_by === 'id') {
        const refString = this.makeEntityRefString(params);
        return await this.getDocumentById(refString);
      }

      // Buscar por campo específico
      const refString = this.makeEntityRefString({
        subEntity: params.subEntity,
        subEntityId: params.subEntityId,
      });
      return await this.getDocumentByField(refString, params.find_by, params.find_value);
    } catch (error) {
      return null;
    }
  }

  async _createOne(params: referenceParams): Promise<T> {
    try {
      params = await this.validateParams(params, 'create');
      const refString = this.makeEntityRefString(params);
      const entityRef = collection(Ss.firestore, refString);
      
      const docRef = await addDoc(entityRef, params.data);
      const docSnapshot = await getDoc(docRef);
      
      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  async createOneInParentCollection(params: CreateInParentParams): Promise<T> {
    try {
      params = (await this.validateParams(params, 'createInParent')) as CreateInParentParams;

      const refString = `${params.parentCollection}/${params.parentId}/${this._firebaseCollectionName}`;
      const entityRef = collection(Ss.firestore, refString);

      const docRef = await addDoc(entityRef, params.data);
      const docSnapshot = await getDoc(docRef);
      
      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  async _updateOne(params: referenceParams): Promise<T> {
    try {
      params = await this.validateParams(params, 'update');
      const refString = this.makeEntityRefString(params);
      const entityRef = doc(Ss.firestore, refString);
      
      await updateDoc(entityRef, params.data);
      const docSnapshot = await getDoc(entityRef);
      
      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  async updateOneInParentCollection(params: UpdateInParentParams): Promise<T> {
    try {
      params = (await this.validateParams(params, 'updateInParent')) as UpdateInParentParams;

      const refString = `${params.parentCollection}/${params.parentId}/${this._firebaseCollectionName}/${params.documentId}`;
      const entityRef = doc(Ss.firestore, refString);

      await updateDoc(entityRef, params.data);
      const docSnapshot = await getDoc(entityRef);
      
      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  // ========== MÉTODOS PARA SUBCOLECCIONES ==========
  async getAllSubCollection(params: SubCollectionParams): Promise<T[]> {
    try {
      const refString = this.makeEntityRefString({
        find_value: params.parentId,
        subEntity: params.subCollection,
      });
      return await this.getDocumentsByField(refString);
    } catch (error) {
      return [];
    }
  }

  async getOneSubCollection(params: SubCollectionParams): Promise<T | null> {
    try {
      // Buscar por ID del documento
      if (!params.find_by || params.find_by === 'id') {
        const refString = this.makeEntityRefString({
          find_value: params.parentId,
          subEntity: params.subCollection,
          subEntityId: params.subId,
        });
        return await this.getDocumentById(refString);
      }

      // Buscar por campo específico
      const refString = this.makeEntityRefString({
        find_value: params.parentId,
        subEntity: params.subCollection,
      });
      return await this.getDocumentByField(refString, params.find_by, params.find_value);
    } catch (error) {
      return null;
    }
  }

  async getAllSubCollectionByField(params: SubCollectionParams): Promise<T[]> {
    try {
      const refString = this.makeEntityRefString({
        find_value: params.parentId,
        subEntity: params.subCollection,
      });
      return await this.getDocumentsByField(refString, params.find_by, params.find_value);
    } catch (error) {
      return [];
    }
  }

  // ========== MÉTODOS ADICIONALES DE CONVENIENCIA ==========
  async _getByField(fieldName: string, fieldValue: any, params: Partial<referenceParams> = {}): Promise<T | null> {
    try {
      const refString = this.makeEntityRefString(params);
      return await this.getDocumentByField(refString, fieldName, fieldValue);
    } catch (error) {
      return null;
    }
  }

  async _getAllByField(fieldName: string, fieldValue: any, params: Partial<referenceParams> = {}): Promise<T[]> {
    try {
      const refString = this.makeEntityRefString(params);
      return await this.getDocumentsByField(refString, fieldName, fieldValue);
    } catch (error) {
      return [];
    }
  }

  async _exists(params: referenceParams): Promise<boolean> {
    try {
      await this._getOne(params);
      return true;
    } catch {
      return false;
    }
  }

  // ========== MÉTODOS DE LIMPIEZA ==========
  clearCache(): void {
    this.resolvedRefs.clear();
  }

  clearCacheForPath(path: string): void {
    this.resolvedRefs.delete(path);
  }
}

export interface referenceParams {
  find_by?: string;
  find_value?: any;
  data?: any;
  subEntity?: string;
  subInterface?: any;
  subEntityId?: any;
}

export interface SubCollectionParams {
  parentId: string;
  subCollection: string;
  subId?: string;
  find_by?: string;
  find_value?: any;
}

export interface CreateInParentParams {
  parentCollection: string;
  parentId: string | number;
  data: any;
}

export interface UpdateInParentParams {
  parentCollection: string;
  parentId: string | number;
  documentId: string | number;
  data: any;
}
