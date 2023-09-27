import {
  BehaviorSubject,
  filter,
  firstValueFrom,
  lastValueFrom,
  Subject,
} from 'rxjs';
import { Injectable } from '@angular/core';

import {
  Functions,
  httpsCallable,
  HttpsCallableOptions,
  HttpsCallableResult,
} from '@angular/fire/functions';
import {
  Auth,
  onAuthStateChanged,
  User,
  authState,
  getIdTokenResult,
  IdTokenResult,
  ParsedToken,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  getStorage,
  ref,
  Storage,
  uploadBytesResumable,
  UploadMetadata,
  UploadTask,
} from '@angular/fire/storage';
import { Messaging } from '@angular/fire/messaging';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  docData,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  query,
  QueryConstraint,
  runTransaction,
  setDoc,
  SetOptions,
  Timestamp,
  Transaction,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  /**
   * Observable of the current user's auth state.
   */
  public authState$ = authState(this.auth);
  public authPromise = firstValueFrom(this.authState$.pipe(filter((x) => !!x)));

  public user$ = new BehaviorSubject<User | null>(null);

  constructor(
    public functions: Functions,
    public auth: Auth,
    public storage: Storage,
    public messaging: Messaging,
    public firestore: Firestore,
    public readonly snackbarService: SnackbarService
  ) {
    globalThis ? ((globalThis as any).firebaseService = this) : 0;

    onAuthStateChanged(this.auth, (user) => {
      this.user$.next(user);
      console.debug('onAuthStateChanged', user);
    });
  }

  //#region AUTH
  public fetchCustomClaims(user: User): Promise<ParsedToken | null> {
    return new Promise((r, j) => {
      if (user) {
        getIdTokenResult(user).then((result) => {
          r(result.claims);
        });
      } else {
        j(null);
      }
    });
  }

  public async getCurrentUser(): Promise<User | null> {
    return await firstValueFrom(this.user$.pipe(filter((user) => !!user)));
  }

  public async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    // const provider = new auth.GoogleAuthProvider();
    return await signInWithPopup(this.auth, provider)
      .catch((e) => {
        this.snackbarService.queueSnackbar({
          duration: 6000,
          message: 'Sign in error',
        });
        return undefined;
      })
      .then(async (c) => {
        return c?.user;
      });
  }

  public async signOut() {
    return await this.auth.signOut();
  }
  //#endregion

  //#region FIRESTORE
  firestoreGenerateId() {
    const ref = doc(collection(this.firestore, 'tmp'));
    return ref.id;
  }

  /**
   * Validates a Firestore path and returns the path type and the validated path.
   */
  public validReferenceFromPath(rawPath: string) {
    // If ends with "/", remove it
    const validatedPath = rawPath.trim().replace(/\/$/, '');

    function isDocumentPath(firestorePath: string): boolean {
      // Split the path into segments based on the "/" delimiter
      const segments = firestorePath.split('/');

      // If the number of segments is even, it's a document path
      return segments.length % 2 === 0;
    }

    function isCollectionPath(firestorePath: string): boolean {
      // Split the path into segments based on the "/" delimiter
      const segments = firestorePath.split('/');

      // If the number of segments is odd, it's a collection path
      return segments.length % 2 === 1;
    }

    const isRootPath = () => {
      return validatedPath === '';
    };

    let ref: DocumentReference | CollectionReference | undefined;
    if (isRootPath()) {
      ref = undefined;
    } else if (isDocumentPath(validatedPath)) {
      ref = doc(this.firestore, validatedPath);
    } else if (isCollectionPath(validatedPath)) {
      ref = collection(this.firestore, validatedPath);
    }

    return {
      isDocumentPath: isDocumentPath(validatedPath),
      isCollectionPath: isCollectionPath(validatedPath),
      isRootPath: isRootPath(),
      validatedPath,
      ref,
    };
  }

  /**
   * runs updateDoc() from Firestore
   * @param path firestore document path
   */
  firestoreDocUpdate(path: string, update: any) {
    return updateDoc(doc(this.firestore, path), update);
  }
  /**
   * runs setDoc() from Firestore
   * @param path firestore document path
   */
  firestoreDocSet(path: string, update: any, setOptions: SetOptions) {
    return setDoc(doc(this.firestore, path), update, setOptions);
  }
  /**
   * runs deleteDoc() from Firestore
   * @param path firestore document path
   */
  firestoreDocDelete(path: string) {
    return deleteDoc(doc(this.firestore, path));
  }

  /**
   * runs collectionData() from Firestore
   * @param collectionPath firestore collection path
   */
  firestoreDocAdd(collectionPath: string, data: any) {
    return addDoc(collection(this.firestore, collectionPath), data);
  }

  /**
   * runs doc() from Firestore
   * @param path firestore document path
   */
  firestoreDoc(path: string) {
    return doc(this.firestore, path);
  }

  /**
   * runs docData() from Firestore
   * @param path firestore document path
   */
  firestoreDocValueChanges(path: string, options?: { idField?: string }) {
    return docData(doc(this.firestore, path), options);
  }

  /**
   * runs getDoc() from Firestore
   * @param path firestore document path
   */
  firestoreDocGet(path: string) {
    return getDoc(doc(this.firestore, path));
  }

  /**
   * runs collection() from Firestore
   * @param collectionPath firestore collection path
   */
  firestoreCollection(collectionPath: string) {
    return collection(this.firestore, collectionPath);
  }

  /**
   * runs collectionData() from AngularFire
   * @param path firestore collection path
   * @param queryConstraints eg: [where('a','==','1'),where('b','==','2')]
   */
  firestoreCollectionValueChanges(
    collectionPath: string,
    queryConstraints: QueryConstraint[],
    options?: { idField?: string }
  ) {
    return collectionData(
      query(collection(this.firestore, collectionPath), ...queryConstraints),
      options
    );
  }
  /**
   * runs getDocs() from Firebase
   * @param collectionPath firestore collection path
   * @param queryConstraints eg: [where('a','==','1'),limit(1)]
   */
  firestoreGetCollection(
    collectionPath: string,
    queryConstraints: QueryConstraint[]
  ) {
    return getDocs(
      query(collection(this.firestore, collectionPath), ...queryConstraints)
    );
  }

  /**
   * runs runTransaction() from Firebase
   */
  firestoreRunTransaction(
    updateFunction: (transaction: Transaction) => Promise<unknown>
  ) {
    return runTransaction(this.firestore, updateFunction);
  }

  firestoreQuery(collectionPath: string, queryConstraints: QueryConstraint[]) {
    return query(
      collection(this.firestore, collectionPath),
      ...queryConstraints
    );
  }

  /**
   * Creates a write batch, used for performing multiple writes as a single atomic operation.
   */
  firestoreWriteBatch() {
    return writeBatch(this.firestore);
  }

  convertFirestoreDates(data: any) {
    if (!data) {
      return data;
    }

    for (const key in data) {
      let item = data[key];

      if (data[key] instanceof Timestamp) {
        data[key] = data[key].toDate();
      } else if (item?.toDate) {
        const date = item?.toDate?.();
        if (date instanceof Date) data[key] = date;
      } else if (
        item instanceof Object &&
        !(item instanceof DocumentReference)
      ) {
        item = this.convertFirestoreDates(item);
      }
    }

    return data;
  }

  // /**
  //  * Retrieves a list of subcollections under a specific document path.
  //  * @param docPath Firestore document path
  //  */
  // public async getSubcollections(docPath: string): Promise<string[]> {
  //   try {
  //     // Ensure the path points to a document (has even segments)
  //     if (docPath.split('/').length % 2 === 0) {
  //       const docRef = doc(this.firestore, docPath);
  //       const collections = await docRef.listCollections();
  //       return collections.map((collection) => collection.id);
  //     } else {
  //       console.error('The provided path does not point to a document');
  //       return [];
  //     }
  //   } catch (error) {
  //     console.error('Error fetching subcollections:', error);
  //     return [];
  //   }
  // }

  //#endregion FIRESTORE

  //#region FIREBASE STORAGE FUNCTIONS

  /**
   * runs ref() from Firebase Storage
   * @param storagePath Firebase Storage Path
   */
  storageRef(storagePath: string) {
    return ref(this.storage, storagePath);
  }

  /**
   * runs uploadBytesResumable() from Firebase Storage
   * @param storagePath Firebase Storage Path
   */
  storageUpload(
    storagePath: string,
    file: Blob | Uint8Array | ArrayBuffer,
    uploadMetadata?: UploadMetadata
  ): UploadTask {
    return uploadBytesResumable(
      ref(this.storage, storagePath),
      file,
      uploadMetadata
    );
  }

  /**
   * runs deleteObject() from Firebase Storage
   * @param storagePath Firebase Storage Path
   */
  storageDelete(storagePath: string) {
    return deleteObject(ref(this.storage, storagePath));
  }

  async storageDownload(storagePath: string): Promise<Blob | void> {
    const storage = getStorage();
    return await getDownloadURL(ref(storage, storagePath))
      .then((url) => {
        // `url` is the download URL for `storagePath`
        return fetch(url).then((r) => r.blob());
      })
      .catch((error) => {
        // Handle any errors
      });
  }

  /**
   *
   */
  async storageGetPreview(storagePath: string, withMetaData: boolean) {
    const r = this.storageRef(storagePath);
    const downloadURL = await getDownloadURL(r);

    let metaData = {};

    if (withMetaData) {
      metaData = await getMetadata(r);
    }

    const preview: storageFilePreview = {
      downloadURL,
      metaData,
    };

    return preview;
  }

  storageTaskPercentageChanges(task: UploadTask) {
    const percentage$ = new BehaviorSubject(0);
    task.on('state_changed', (x) => {
      const progress = (x.bytesTransferred / x.totalBytes) * 100;
      percentage$.next(progress);
    });
    return percentage$;
  }

  //#endregion

  //#region Firebase Functions
  /**
   *Returns a reference to the callable HTTPS trigger with the given name.
   */
  public async httpsCallable<RequestData = any, ResponseData = any>(
    functionName: string,
    data: RequestData,
    options?: HttpsCallableOptions
  ): Promise<HttpsCallableResult<ResponseData>> {
    const fn = httpsCallable<RequestData, ResponseData>(
      this.functions,
      functionName,
      options
    );
    return await fn(data);
  }
}

export type storageFilePreview = {
  downloadURL: string;
  metaData: any;
};
