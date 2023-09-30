import { Injectable, WritableSignal, signal } from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
  limit,
} from '@angular/fire/firestore';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { FirebaseService } from '@app/services';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { IFirebaseConfig } from './database.model';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  public readonly config: IFirebaseConfig = environment.firebase;

  /** The Firestore Path, can be either a document path or a collection path */
  public readonly path$ = new BehaviorSubject<string>(
    localStorage.getItem(`${environment.firebase.projectId}.path`) || ''
  );

  public readonly cacheView: {
    [path: string]: DatabaseNode;
  } = {
    '': new DatabaseNode({ ref: undefined, children: [] }),
  };

  constructor(public readonly firebaseService: FirebaseService) {
    this.firebaseService.authPromise.then((user) => {
      if (!user) {
        return;
      }

      this.path$.subscribe((rawPath) => {
        this.createCacheViewNodes(rawPath);
        this.onPathChange(rawPath);
      });
    });
  }

  /**
   * Ensure that the cacheView contains a node for the given path, and recursively create nodes for parent segments if they don't exist
   */
  private createCacheViewNodes(
    rawPath: string,
    child?: DocumentReference | CollectionReference
  ) {
    const validation = this.firebaseService.validReferenceFromPath(rawPath);
    if (!validation.validatedPath) {
      return;
    }

    this.cacheView[validation.validatedPath] ||= new DatabaseNode({
      ref: validation.ref,
      children: [...(child ? [child] : [])],
    });

    const parentRef = validation.ref?.parent;

    if (!parentRef) {
      return;
    }

    this.createCacheViewNodes(parentRef.path, validation.ref);
  }

  private onPathChange(rawPath: string) {
    const validation = this.firebaseService.validReferenceFromPath(rawPath);

    // If the path isn't the same as the validated path, then we need to update the path
    if (rawPath !== validation?.ref?.path && validation.ref?.path) {
      this.path$.next(validation.ref.path);
      return;
    }

    if (validation.isDocumentPath || validation.isRootPath) {
      this.listCollections(validation.validatedPath);
    } else if (validation.isCollectionPath) {
      this.listDocuments(validation.validatedPath);
    }

    localStorage.setItem(
      `${environment.firebase.projectId}.path`,
      validation.validatedPath
    );
  }

  private async listCollections(rawPath: string) {
    const validated = this.firebaseService.validReferenceFromPath(rawPath);
    if (!validated.isDocumentPath && !validated.isRootPath) {
      console.error('Invalid Document Path', rawPath);
      return;
    }

    const node: DatabaseNode = new DatabaseNode({
      ref: validated.ref,
      children: [],
    });

    this.cacheView[validated.validatedPath] = node;

    node.isLoading.set(true);

    const listCollections = await this.firebaseService.httpsCallable<
      { path: string },
      string[]
    >('listCollections', { path: validated.validatedPath });

    setTimeout(() => {
      node.isLoading.set(false);
    }, 750);
    node.children = listCollections.data.map((path) =>
      this.firebaseService.firestoreCollection(path)
    );

    console.debug('this.database', this.cacheView);

    return listCollections.data || [];
  }
  /** Get a list of documents for a given collection path */
  private async listDocuments(rawPath: string) {
    const validated = this.firebaseService.validReferenceFromPath(rawPath);
    if (!validated.isCollectionPath) {
      console.error('Invalid Collection Path', rawPath);
      return;
    }

    const node: DatabaseNode = new DatabaseNode({
      ref: validated.ref,
      children: [],
    });

    this.cacheView[validated.validatedPath] = node;

    node.isLoading.set(true);

    const listDocuments = await this.firebaseService.firestoreGetCollection(
      validated.validatedPath,
      [limit(10)]
    );

    setTimeout(() => {
      node.isLoading.set(false);
    }, 750);
    node.children = listDocuments.docs.map((doc) => doc.ref);

    console.debug('this.database', this.cacheView);

    return listDocuments || [];
  }
}

export class DatabaseNode {
  children: (CollectionReference | DocumentReference)[];
  ref: CollectionReference | DocumentReference | undefined;

  readonly isLoading: WritableSignal<boolean> = signal<boolean>(false);

  public get isCollection(): boolean {
    return this?.ref?.type === 'collection';
  }
  public get isDocument(): boolean {
    return this?.ref?.type === 'document';
  }
  public get isRoot(): boolean {
    return !this?.ref || this?.ref?.path === '';
  }

  constructor(node: Partial<DatabaseNode>) {
    this.children = node.children || [];
    this.ref = node.ref;
  }
}

export type DatabaseFormControls = {
  collectionId: FormControl<string | null>;
  documentId: FormControl<string | null>;
  fields: FormArray<FormGroup<DatabaseFieldControls>>;
};
export type DatabaseFieldControls = {
  field: FormControl<string | null>;
  type: FormControl<DatabaseFieldType | null>;
  value: FormControl<any | null>;
};

export type ModifyDatabaseFormGroup = FormGroup<{
  collectionId: FormControl<string | null>;
  documentId: FormControl<string | null>;
  fields: FormArray<FormGroup<DatabaseFieldControls>>;
}>;

export enum DatabaseFieldType {
  Null = 'null',
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Timestamp = 'timestamp',
  GeoPoint = 'geopoint',
  Reference = 'reference',
  Array = 'array',
  Map = 'map',
}

export function getDatabaseFieldType(
  value: any
): DatabaseFieldType | undefined {
  if (value === null || value === undefined) {
    return DatabaseFieldType.Null;
  } else if (typeof value === 'string') {
    return DatabaseFieldType.String;
  } else if (typeof value === 'number') {
    return DatabaseFieldType.Number;
  } else if (typeof value === 'boolean') {
    return DatabaseFieldType.Boolean;
  } else if (typeof value === 'object' && value instanceof Date) {
    return DatabaseFieldType.Timestamp;
  } else if (typeof value === 'object' && value instanceof Array) {
    return DatabaseFieldType.Array;
  } else if (typeof value === 'object' && value instanceof Object) {
    return DatabaseFieldType.Map;
  }

  return undefined;
}
