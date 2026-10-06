import { Injectable } from '@angular/core';

export interface ArchivedCuadreSnapshot {
  archivedAt: string;
  form: any;
}

@Injectable({ providedIn: 'root' })
export class CuadreArchiveStorageService {
  private readonly dbName = 'novac_cuadre_archive';
  private readonly dbVersion = 1;
  private readonly storeName = 'cuadres';
  private readonly archiveKey = 'current';
  private readonly maxAgeMs = 20 * 60 * 60 * 1000;
  private dbPromise?: Promise<IDBDatabase>;

  async get(): Promise<ArchivedCuadreSnapshot | null> {
    const record = await this.read();
    if (!record) return null;

    if (this.isExpired(record)) {
      await this.clear();
      return null;
    }

    return record;
  }

  async save(form: any): Promise<ArchivedCuadreSnapshot> {
    const record: ArchivedCuadreSnapshot = {
      archivedAt: new Date().toISOString(),
      form,
    };
    const db = await this.getDb();

    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName).put({ id: this.archiveKey, ...record });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return record;
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(this.storeName, 'readwrite').objectStore(this.storeName).delete(this.archiveKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async read(): Promise<ArchivedCuadreSnapshot | null> {
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      const request = db.transaction(this.storeName, 'readonly').objectStore(this.storeName).get(this.archiveKey);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { archivedAt: result.archivedAt, form: result.form } : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName, { keyPath: 'id' });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private isExpired(record: ArchivedCuadreSnapshot): boolean {
    const archivedTime = new Date(record.archivedAt).getTime();
    if (Number.isNaN(archivedTime)) return true;
    return Date.now() - archivedTime >= this.maxAgeMs;
  }
}
