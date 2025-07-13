import { addDoc, collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, limit, DocumentReference, WhereFilterOp } from '@angular/fire/firestore';
import { Ss } from '@core/services/singleton.service';
import { fun } from '@core/services/functions.service';
import { runInInjectionContext, Injector, inject } from '@angular/core';
import { ReferenceResolver } from './reference-resolver';

export class FirebaseRequest<T> {
  private _firebaseCollectionName!: string;
  private referenceResolver = inject(ReferenceResolver);

  set firebaseCollectionName(value: string) {
    this._firebaseCollectionName = value;
  }

  // ========== MÉTODOS DE VALIDACIÓN ==========
  private async validateParams(
    params: referenceParams | CreateInParentParams | UpdateInParentParams | DeleteInParentParams,
    type: 'getAll' | 'getOne' | 'create' | 'update' | 'delete' | 'createInParent' | 'updateInParent' | 'deleteInParent'
  ): Promise<referenceParams | CreateInParentParams | UpdateInParentParams | DeleteInParentParams> {
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

    // Validación específica para deleteInParent
    if (type === 'deleteInParent') {
      const deleteParams = params as DeleteInParentParams;
      if (fun.isEmpty(deleteParams.parentCollection)) throw new Error('parentCollection is required');
      if (fun.isEmpty(deleteParams.parentId)) throw new Error('parentId is required');
      if (fun.isEmpty(deleteParams.documentId)) throw new Error('documentId is required');
      return deleteParams;
    }

    // Validaciones para otros tipos
    const refParams = params as referenceParams;
    if (fun.isEmpty(refParams.find_by)) refParams.find_by = 'id';

    const findValueRequired = ['getOne', 'update', 'delete'];
    if (fun.isEmpty(refParams.find_value) && findValueRequired.includes(type)) {
      throw new Error('find_value is required');
    }

    return refParams;
  }

  // ========== MÉTODOS HELPER ==========
  private async mapDocumentToObject(docSnapshot: any): Promise<T> {
    const data = { ...((docSnapshot.data() as object) || {}), id: docSnapshot.id };
    return (await this.referenceResolver.resolveDocumentReferences(data, 0)) as T;
  }

  private async mapDocumentsToArray(docs: any[]): Promise<T[]> {
    return Promise.all(docs.map(doc => this.mapDocumentToObject(doc)));
  }

  private makeEntityRefString(params: Partial<referenceParams> = {}): string {
    let refString = this._firebaseCollectionName;
    if (params.parentCollection) refString = `${params.parentCollection}/${params.parentId}/${this._firebaseCollectionName}`;

    if (params.find_value) refString += `/${params.find_value}`;
    if (params.subEntity) refString += `/${params.subEntity}`;
    if (params.subEntityId) refString += `/${params.subEntityId}`;

    return refString;
  }

  private createQuery(collectionRef: any, findBy: string, findValue: any, limitCount?: number) {
    let q = query(collectionRef, where(findBy, '==', findValue));
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    return q;
  }

  private createMultiFieldQuery(collectionRef: any, conditions: Array<{ field: string; value: any; operator?: WhereFilterOp }>, limitCount?: number) {
    let q = collectionRef;

    // Aplicar todas las condiciones where
    conditions.forEach(condition => {
      const operator = condition.operator || '==';
      q = query(q, where(condition.field, operator, condition.value));
    });

    // Aplicar límite si se especifica
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    return q;
  }

  // ========== MÉTODOS PARA OBTENER POR ID ==========
  private async getDocumentById(refString: string): Promise<T | null> {
    return runInInjectionContext(Ss.injector, async () => {
      const entityRef = doc(Ss.firestore, refString);
      const entitySnapshot = await getDoc(entityRef);

      if (!entitySnapshot.exists()) {
        return null;
      }

      return await this.mapDocumentToObject(entitySnapshot);
    });
  }

  // ========== MÉTODOS PARA OBTENER POR CAMPO ==========
  private async getOneDocumentByField(collectionPath: string, fieldName: string, fieldValue: any): Promise<T | null> {
    return runInInjectionContext(Ss.injector, async () => {
      const entityRef = collection(Ss.firestore, collectionPath);
      const q = this.createQuery(entityRef, fieldName, fieldValue, 1);
      const entitySnapshot = await getDocs(q);

      if (entitySnapshot.empty) {
        return null;
      }

      return await this.mapDocumentToObject(entitySnapshot.docs[0]);
    });
  }

  private async getDocumentsByField(collectionPath: string, fieldName?: string, fieldValue?: any): Promise<T[]> {
    return runInInjectionContext(Ss.injector, async () => {
      const entityRef = collection(Ss.firestore, collectionPath);

      let q;
      if (fieldName && fieldValue !== undefined) {
        q = this.createQuery(entityRef, fieldName, fieldValue);
      } else {
        q = entityRef;
      }

      const entitySnapshot = await getDocs(q);

      return await this.mapDocumentsToArray(entitySnapshot.docs);
    });
  }

  private async getDocumentsByMultipleFields(collectionPath: string, conditions: Array<{ field: string; value: any; operator?: WhereFilterOp }>): Promise<T[]> {
    return runInInjectionContext(Ss.injector, async () => {
      const entityRef = collection(Ss.firestore, collectionPath);
      const q = this.createMultiFieldQuery(entityRef, conditions);

      const entitySnapshot = await getDocs(q);

      return await this.mapDocumentsToArray(entitySnapshot.docs);
    });
  }

  private async getOneDocumentByMultipleFields(collectionPath: string, conditions: Array<{ field: string; value: any; operator?: WhereFilterOp }>): Promise<T | null> {
    return runInInjectionContext(Ss.injector, async () => {
      const entityRef = collection(Ss.firestore, collectionPath);
      const q = this.createMultiFieldQuery(entityRef, conditions, 1);
      const entitySnapshot = await getDocs(q);

      if (entitySnapshot.empty) {
        return null;
      }

      return await this.mapDocumentToObject(entitySnapshot.docs[0]);
    });
  }

  // ========== MÉTODOS PÚBLICOS PRINCIPALES ==========
  async _getAll<K = T>(params: referenceParams = {}): Promise<T[] | K[]> {
    try {
      params = (await this.validateParams(params, 'getAll')) as referenceParams;

      // Si no hay filtros específicos, usar la ruta completa
      if (!params.find_by || params.find_by === 'id') {
        const refString = params?.refString ? params.refString : this.makeEntityRefString(params);

        return await this.getDocumentsByField(refString);
      }

      // Para búsquedas por campo específico, usar solo la colección base
      const refString = this.makeEntityRefString({
        subEntity: params.subEntity,
        subEntityId: params.subEntityId,
      });

      return await this.getDocumentsByField(refString, params.find_by, params.find_value);
    } catch (error) {
      return [];
    }
  }

  async _getOne(params: referenceParams): Promise<T | null> {
    try {
      params = (await this.validateParams(params, 'getOne')) as referenceParams;

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
      return await this.getOneDocumentByField(refString, params.find_by, params.find_value);
    } catch (error) {
      return null;
    }
  }

  async _createOne(params: referenceParams): Promise<T> {
    try {
      params = (await this.validateParams(params, 'create')) as referenceParams;
      const refString = params?.refString ? params.refString : this.makeEntityRefString(params);
      const entityRef = collection(Ss.firestore, refString);

      const { id, ...data } = { ...params.data };
      const docRef = await addDoc(entityRef, data);
      const docSnapshot = await getDoc(docRef);

      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  async _updateOne(params: referenceParams): Promise<T> {
    if (fun.isEmpty(params.data.id)) {
      await new Promise(resolve => setTimeout(resolve, 100));
      throw new Error('ID is required for update operation');
    }
    try {
      params = (await this.validateParams(params, 'update')) as referenceParams;
      params.find_value = params.data.id;

      const refString = params?.refString ? params.refString : this.makeEntityRefString(params);
      const entityRef = doc(Ss.firestore, refString);

      const { id, ...data } = { ...params.data };
      await updateDoc(entityRef, data);
      const docSnapshot = await getDoc(entityRef);

      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  async _deleteOne(params: referenceParams): Promise<boolean> {
    if (fun.isEmpty(params.find_value)) {
      await new Promise(resolve => setTimeout(resolve, 100));
      throw new Error('ID is required for delete operation');
    }
    try {
      params = (await this.validateParams(params, 'delete')) as referenceParams;

      const refString = this.makeEntityRefString(params);
      const entityRef = doc(Ss.firestore, refString);

      // Verificar que el documento existe antes de eliminarlo
      const docSnapshot = await getDoc(entityRef);
      if (!docSnapshot.exists()) {
        throw new Error('Document not found');
      }

      await deleteDoc(entityRef);

      // Limpiar cache si existe
      this.clearCacheForPath(refString);

      return true;
    } catch (error) {
      throw error;
    }
  }

  // ========== MÉTODOS PARA COLECCIÓN PADRE ==========
  async createOneInParentCollection(params: CreateInParentParams): Promise<T> {
    try {
      params = (await this.validateParams(params, 'createInParent')) as CreateInParentParams;

      const refString = `${params.parentCollection}/${params.parentId}/${this._firebaseCollectionName}`;
      const entityRef = collection(Ss.firestore, refString);

      const { id, ...data } = { ...params.data };
      const docRef = await addDoc(entityRef, data);
      const docSnapshot = await getDoc(docRef);

      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  async updateOneInParentCollection(params: UpdateInParentParams): Promise<T> {
    try {
      params = (await this.validateParams(params, 'updateInParent')) as UpdateInParentParams;

      const refString = params?.refString ? params.refString : `${this.makeEntityRefString(params)}/${params.documentId}`;
      // const refString = `${params.parentCollection}/${params.parentId}/${this._firebaseCollectionName}/${params.documentId}`;
      const entityRef = doc(Ss.firestore, refString);

      const { id, ...data } = { ...params.data };
      await updateDoc(entityRef, data);
      const docSnapshot = await getDoc(entityRef);

      return await this.mapDocumentToObject(docSnapshot);
    } catch (error) {
      throw error;
    }
  }

  async deleteOneInParentCollection(params: DeleteInParentParams): Promise<boolean> {
    try {
      params = (await this.validateParams(params, 'deleteInParent')) as DeleteInParentParams;

      const refString = `${params.parentCollection}/${params.parentId}/${this._firebaseCollectionName}/${params.documentId}`;
      const entityRef = doc(Ss.firestore, refString);

      // Verificar que el documento existe antes de eliminarlo
      const docSnapshot = await getDoc(entityRef);
      if (!docSnapshot.exists()) {
        throw new Error('Document not found');
      }

      await deleteDoc(entityRef);

      // Limpiar cache si existe
      this.clearCacheForPath(refString);

      return true;
    } catch (error) {
      throw error;
    }
  }

  async getAllFromParentCollection(params: GetAllFromParentParams): Promise<T[]> {
    try {
      const refString = params?.refString ? params.refString : this.makeEntityRefString(params);

      if (params.find_by && params.find_value !== undefined) {
        return await this.getDocumentsByField(refString, params.find_by, params.find_value);
      } else {
        return await this.getDocumentsByField(refString);
      }
    } catch (error) {
      return [];
    }
  }

  async getOneFromParentCollection(params: GetOneFromParentParams): Promise<T | null> {
    try {
      const refString = `${params.parentCollection}/${params.parentId}/${this._firebaseCollectionName}/${params.documentId}`;
      return await this.getDocumentById(refString);
    } catch (error) {
      return null;
    }
  }

  // ========== MÉTODOS ADICIONALES DE CONVENIENCIA ==========
  async _getByField(fieldName: string, fieldValue: any, params: Partial<referenceParams> = {}): Promise<T | null> {
    try {
      const refString = this.makeEntityRefString(params);
      return await this.getOneDocumentByField(refString, fieldName, fieldValue);
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

  async _getAllByMultipleFields(conditions: Array<{ field: string; value: any; operator?: WhereFilterOp }>, params: Partial<referenceParams> = {}): Promise<T[]> {
    try {
      const refString = params?.refString ? params.refString : this.makeEntityRefString(params);
      return await this.getDocumentsByMultipleFields(refString, conditions);
    } catch (error) {
      return [];
    }
  }

  async _getOneByMultipleFields(conditions: Array<{ field: string; value: any; operator?: WhereFilterOp }>, params: Partial<referenceParams> = {}): Promise<T | null> {
    try {
      const refString = this.makeEntityRefString(params);
      return await this.getOneDocumentByMultipleFields(refString, conditions);
    } catch (error) {
      return null;
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

  async getDocumentRef(args: { id: string; collectionName?: string }): Promise<DocumentReference | null> {
    try {
      const collectionName = args.collectionName || this._firebaseCollectionName;
      return doc(Ss.firestore, `${collectionName}/${args.id}`);
    } catch {
      return null;
    }
  }

  // ========== MÉTODOS DE LIMPIEZA ==========
  clearCache(): void {
    this.referenceResolver.clearCache();
  }

  clearCacheForPath(path: string): void {
    this.referenceResolver.clearCacheForPath(path);
  }
}

export interface referenceParams {
  find_by?: string;
  find_value?: any;
  data?: any;
  subEntity?: string;
  subInterface?: any;
  subEntityId?: any;
  parentCollection?: string;
  parentId?: string | number;
  documentId?: string | number;
  refString?: string;
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
  refString?: string;
}

export interface DeleteInParentParams {
  parentCollection: string;
  parentId: string | number;
  documentId: string | number;
}

export interface GetAllFromParentParams {
  parentCollection: string;
  parentId: string | number;
  find_by?: string;
  find_value?: any;
  refString?: string;
  documentId?: string | number;
}

export interface GetOneFromParentParams {
  parentCollection: string;
  parentId: string | number;
  documentId: string | number;
}
