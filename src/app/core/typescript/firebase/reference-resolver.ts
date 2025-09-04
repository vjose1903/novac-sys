import { inject, Injectable, Injector } from '@angular/core';
import { DocumentReference, getDoc } from 'firebase/firestore';
import { runInInjectionContext } from '@angular/core';
import { Ss } from '@core/services/singleton.service';

@Injectable({
  providedIn: 'root',
})
export class ReferenceResolver {
  private resolvedRefs = new Map<string, any>(); // Cache para referencias ya resueltas
  private pendingRefs = new Map<string, Promise<any>>(); // Cache para promesas pendientes
  public injector = inject(Injector);
  private batchSize = 10; // Tamaño del lote para requests en batch
  private maxDepth = 3; // Profundidad máxima de recursión

  /**
   * Resuelve todas las referencias de DocumentReference en un objeto
   */
  async resolveDocumentReferences(data: any, depth: number = 0): Promise<any> {
    // Validaciones rápidas
    if (!data || typeof data !== 'object' || depth > this.maxDepth) return data;

    // Procesar arrays
    if (Array.isArray(data)) {
      return await this.processArrayOptimized(data, depth);
    }

    // Procesar objetos
    return await this.processObjectOptimized(data, depth);
  }

  /**
   * Procesa un array de manera optimizada
   */
  private async processArrayOptimized(data: any[], depth: number): Promise<any[]> {
    if (depth > this.maxDepth || data.length === 0) return data;

    // Usar un solo pase para clasificar elementos
    const references: { index: number; ref: DocumentReference }[] = [];
    const nestedItems: { index: number; item: any }[] = [];
    const result = new Array(data.length);

    // Clasificar elementos en un solo pase
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (this.isDocumentReference(item)) {
        references.push({ index: i, ref: item as DocumentReference });
      } else if (item && typeof item === 'object') {
        nestedItems.push({ index: i, item });
      } else {
        result[i] = item; // Primitivos se asignan directamente
      }
    }

    // Procesar referencias y objetos anidados en paralelo
    const [resolvedRefs] = await Promise.all([this.resolveReferencesBatch(references.map(r => r.ref)), this.processNestedItems(nestedItems, result, depth + 1)]);

    // Asignar referencias resueltas
    references.forEach(({ index }, refIndex) => {
      result[index] = resolvedRefs[refIndex];
    });

    return result;
  }

  /**
   * Procesa elementos anidados de manera paralela
   */
  private async processNestedItems(nestedItems: { index: number; item: any }[], result: any[], depth: number): Promise<void> {
    if (nestedItems.length === 0) return;

    const promises = nestedItems.map(async ({ index, item }) => {
      if (Array.isArray(item)) {
        result[index] = await this.processArrayOptimized(item, depth);
      } else {
        result[index] = await this.resolveDocumentReferences(item, depth);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Procesa un objeto de manera optimizada
   */
  private async processObjectOptimized(data: any, depth: number): Promise<any> {
    if (depth > this.maxDepth) return data;

    const entries = Object.entries(data);
    if (entries.length === 0) return data;

    const references: { key: string; ref: DocumentReference }[] = [];
    const nestedProps: { key: string; value: any }[] = [];
    const result = { ...data };

    // Clasificar propiedades en un solo pase
    for (const [key, value] of entries) {
      if (this.isDocumentReference(value)) {
        references.push({ key, ref: value as DocumentReference });
      } else if (value && typeof value === 'object') {
        nestedProps.push({ key, value });
      }
      // Primitivos ya están en result por el spread
    }

    // Procesar referencias y propiedades anidadas en paralelo
    const [resolvedRefs] = await Promise.all([this.resolveReferencesBatch(references.map(r => r.ref)), this.processNestedProps(nestedProps, result, depth + 1)]);

    // Asignar referencias resueltas
    references.forEach(({ key }, refIndex) => {
      result[key] = resolvedRefs[refIndex];
    });

    return result;
  }

  /**
   * Procesa propiedades anidadas de manera paralela
   */
  private async processNestedProps(nestedProps: { key: string; value: any }[], result: any, depth: number): Promise<void> {
    if (nestedProps.length === 0) return;

    const promises = nestedProps.map(async ({ key, value }) => {
      if (Array.isArray(value)) {
        result[key] = await this.processArrayOptimized(value, depth);
      } else {
        result[key] = await this.resolveDocumentReferences(value, depth);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Resuelve múltiples referencias en batch para mejor rendimiento
   */
  private async resolveReferencesBatch(refs: DocumentReference[]): Promise<any[]> {
    if (refs.length === 0) return [];

    // Pre-filtrar referencias usando Map para O(1) lookup
    const refMap = new Map<string, number>();
    const uncachedRefs: { index: number; ref: DocumentReference }[] = [];
    const result = new Array(refs.length);

    // Primer pase: identificar referencias cacheadas
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      const refKey = ref.path;

      if (this.resolvedRefs.has(refKey)) {
        result[i] = this.resolvedRefs.get(refKey);
      } else if (this.pendingRefs.has(refKey)) {
        result[i] = this.pendingRefs.get(refKey);
      } else {
        uncachedRefs.push({ index: i, ref });
      }
    }

    // Procesar referencias no cacheadas en lotes más eficientes
    if (uncachedRefs.length > 0) {
      await this.processBatchesParallel(uncachedRefs, result);
    }

    return result;
  }

  /**
   * Procesa múltiples lotes en paralelo cuando es posible
   */
  private async processBatchesParallel(uncachedRefs: { index: number; ref: DocumentReference }[], result: any[]): Promise<void> {
    const batches = this.chunkArray(uncachedRefs, this.batchSize);

    // Procesar primeros lotes en paralelo (máximo 3 lotes concurrentes)
    const concurrentBatches = Math.min(3, batches.length);
    const promises: Promise<void>[] = [];

    for (let i = 0; i < concurrentBatches; i++) {
      promises.push(this.processBatch(batches[i], result));
    }

    await Promise.all(promises);

    // Procesar lotes restantes secuencialmente para evitar sobrecargar Firestore
    for (let i = concurrentBatches; i < batches.length; i++) {
      await this.processBatch(batches[i], result);
    }
  }

  /**
   * Procesa un lote de referencias
   */
  private async processBatch(batch: { index: number; ref: DocumentReference }[], result: any[]): Promise<void> {
    const promises = batch.map(async ({ index, ref }) => {
      const refKey = ref.path;

      // Doble verificación para evitar duplicados
      if (this.resolvedRefs.has(refKey)) {
        result[index] = this.resolvedRefs.get(refKey);
        return;
      }

      if (this.pendingRefs.has(refKey)) {
        result[index] = await this.pendingRefs.get(refKey);
        return;
      }

      // Crear promesa pendiente para evitar duplicados
      const pendingPromise = this.resolveSingleReferenceOptimized(ref);
      this.pendingRefs.set(refKey, pendingPromise);

      try {
        const resolved = await pendingPromise;
        result[index] = resolved;
        this.resolvedRefs.set(refKey, resolved);
      } catch (error) {
        console.warn(`Error resolving reference ${refKey}:`, error);
        result[index] = null;
        this.resolvedRefs.set(refKey, null);
      } finally {
        this.pendingRefs.delete(refKey);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Resuelve una referencia individual optimizada
   */
  private async resolveSingleReferenceOptimized(docRef: DocumentReference): Promise<any> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as object;
          return { ...data, id: docSnapshot.id };
        }
        return null;
      } catch (error) {
        console.warn(`Error resolving document reference ${docRef.path}:`, error);
        return null;
      }
    });
  }

  /**
   * Divide un array en lotes más pequeños
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    if (array.length === 0) return [];

    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Verifica si un valor es una referencia de DocumentReference de Firebase (optimizada)
   */
  private isDocumentReference(value: any): boolean {
    // Verificación optimizada con early returns
    if (!value || typeof value !== 'object') return false;
    if (!value.path || typeof value.path !== 'string') return false;
    if (!value.id || !value.parent) return false;
    return value.path.includes('/');
  }

  /**
   * Limpia el cache de referencias resueltas
   */
  clearCache(): void {
    this.resolvedRefs.clear();
    this.pendingRefs.clear();
  }

  /**
   * Limpia el cache para una ruta específica
   */
  clearCacheForPath(path: string): void {
    // Usar iteradores para mejor rendimiento
    for (const [key] of this.resolvedRefs) {
      if (key.startsWith(path)) {
        this.resolvedRefs.delete(key);
      }
    }
    for (const [key] of this.pendingRefs) {
      if (key.startsWith(path)) {
        this.pendingRefs.delete(key);
      }
    }
  }

  /**
   * Configura el tamaño del lote para optimización
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(50, size)); // Limitar entre 1 y 50
  }

  /**
   * Configura la profundidad máxima de recursión
   */
  setMaxDepth(depth: number): void {
    this.maxDepth = Math.max(1, Math.min(10, depth)); // Limitar entre 1 y 10
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): { resolved: number; pending: number } {
    return {
      resolved: this.resolvedRefs.size,
      pending: this.pendingRefs.size,
    };
  }
}
