import { Injectable } from '@angular/core';

import Dexie, { Table } from 'dexie';

//#region Local Database Models
const databaseVersion = 1;

/** based on Indexed DB using Dexie.js */

interface IProject {
  name: string;
}
interface ILevel {
  path: string;
  parent: string;
  name: string;
}

export class LocalDatabase extends Dexie implements ILocalDatabaseStores {
  projects!: Table<IProject, string>;
  levels!: Table<ILevel, string>;

  constructor() {
    super('DaxurEngine');

    const stores: {
      [key in keyof ILocalDatabaseStores]: string;
    } = {
      projects: '++name',
      levels: '++path, parent, name',
    };

    this.version(databaseVersion).stores(stores);
  }
}

interface ILocalDatabaseStores {
  projects: Table<IProject, string>;
  levels: Table<ILevel, string>;
}
//#endregion

//#region Local Database Service
@Injectable({
  providedIn: 'root',
})
export class LocalDatabaseService {
  database = new LocalDatabase();

  //#region Table Getters
  get projects(): Table<IProject, string> {
    return this.database.projects;
  }
  get levels(): Table<ILevel, string> {
    return this.database.levels;
  }
  //#endregion

  constructor() {
    if (!this.isStoragePersisted()) {
      this.requestStoragePersist();
    }
  }

  /**
   * Use this wisely, as ObjectURLs are not automatically cleaned up.
   */
  static getObjectURLForBlob(data: Blob | undefined | null, type: string) {
    if (!data) {
      return null;
    }
    const url = URL.createObjectURL(data);
    return url;
  }

  static revokeObjectURL(url: string) {
    URL.revokeObjectURL(url);
  }

  //#region Storage Persistance
  /** Asks the user for permission to persist data to disk.*/
  private requestStoragePersist() {
    return (
      navigator.storage &&
      navigator.storage.persist &&
      navigator.storage.persist()
    );
  }
  /** Returns a promise that resolves to a boolean indicating whether the storage is persisted */
  isStoragePersisted() {
    return navigator.storage && navigator.storage.persisted
      ? navigator.storage.persisted()
      : undefined;
  }
  //#endregion
}
//#endregion
