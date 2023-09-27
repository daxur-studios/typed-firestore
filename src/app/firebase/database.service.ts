import { Injectable } from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
  limit,
} from '@angular/fire/firestore';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { FirebaseService } from '@app/services';
import { BehaviorSubject, distinctUntilChanged, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { IFirebaseConfig } from './database.model';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  public readonly config: IFirebaseConfig = environment.firebase;

  /** The Firestore Path, can be either a document path or a collection path */
  public readonly path$ = new BehaviorSubject<string>('');

  public readonly database: {
    [path: string]: DatabaseNode;
  } = {};

  constructor(public readonly firebaseService: FirebaseService) {
    this.firebaseService.authPromise.then((user) => {
      if (!user) {
        return;
      }
      this.path$.next(`private/user/${user.uid}`);

      // Get root collections
      //this.listCollections('');

      this.path$
        .pipe(
          distinctUntilChanged(),
          switchMap(async (rawPath) => {
            const validation =
              this.firebaseService.validReferenceFromPath(rawPath);

            if (rawPath !== validation?.ref?.path && validation.ref?.path) {
              this.path$.next(validation.ref.path);
              return;
            }

            if (validation.isDocumentPath || validation.isRootPath) {
              this.listCollections(validation.validatedPath);
            } else {
              this.listDocuments(validation.validatedPath);
            }

            return;

            //#region Root, or Document
            // if (validation.isRootPath || validation.isDocumentPath) {
            //   const collectionPaths = await this.listCollections(validation.path);

            //   tree[validation.path] = {
            //     type: DatabaseViewerEnum.Document,
            //     id: validation.path,
            //     collectionPaths,
            //     documentData: {},
            //     isRootPath: validation.isRootPath,
            //   };

            //   const firstCollection = collectionPaths[0];
            //   if (firstCollection) {
            //     return this.firebaseService.firestoreCollectionValueChanges(
            //       firstCollection,
            //       [limit(10)],
            //       { idField: '_id' }
            //     );
            //   } else {
            //     return of([]);
            //   }
            // }
            // //#endregion Root, or Document

            // //#region Collection
            // if (validation.isCollectionPath && !validation.isRootPath) {
            //   return this.firebaseService.firestoreCollectionValueChanges(
            //     validation.path,
            //     [limit(10)],
            //     { idField: '_id' }
            //   );
            // }

            // return;
            //#endregion Collection
          })
        )
        .subscribe((doc) => {
          //this.p$.next(doc);
          console.warn('doc$', doc);
        });
    });
  }

  private async listCollections(rawPath: string) {
    const validated = this.firebaseService.validReferenceFromPath(rawPath);
    if (!validated.ref && !validated.isRootPath) {
      console.error('Invalid path', rawPath);
      return;
    }

    const listCollections = await this.firebaseService.httpsCallable<
      { path: string },
      string[]
    >('listCollections', { path: validated.validatedPath });

    this.database[validated.validatedPath] = {
      children:
        listCollections.data.map((path) =>
          this.firebaseService.firestoreCollection(path)
        ) || [],
      ref: validated.ref!,
    };

    console.debug('this.database', this.database);

    return listCollections.data || [];
  }
  private async listDocuments(rawPath: string) {
    const validation = this.firebaseService.validReferenceFromPath(rawPath);
    if (!validation.ref || !validation.isDocumentPath) {
      console.error('Invalid path', rawPath);
      //return;
    }

    const listDocuments = await this.firebaseService.firestoreGetCollection(
      validation.validatedPath,
      [limit(10)]
    );

    this.database[validation.validatedPath] = {
      children: listDocuments.docs.map((doc) => doc.ref),
      ref: validation.ref!,
    };

    console.debug('this.database', this.database);

    return listDocuments || [];
  }
}

export type DatabaseNode = {
  children: (CollectionReference | DocumentReference)[];
  ref: CollectionReference | DocumentReference | undefined;
};

// export type BaseNode = {
//   ref: CollectionReference | DocumentReference;
// } & (ICollectionNode | IDocumentNode);

// export interface IDocumentNode {
//   ref: DocumentReference;
//   children: CollectionReference[];
// }

// export interface ICollectionNode {
//   ref: CollectionReference;
//   children: DocumentReference[];
// }

interface IValidatedPath {
  isDocumentPath: boolean;
  isCollectionPath: boolean;
  isRootPath: boolean;
  path: string;
  pathSegments: string[];
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

export enum DatabaseFieldType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Timestamp = 'timestamp',
  GeoPoint = 'geopoint',
  Array = 'array',
  Object = 'object',
}
