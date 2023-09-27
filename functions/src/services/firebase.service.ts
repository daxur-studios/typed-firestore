import type { App } from 'firebase-admin/app';
//import * as firestoreModule from 'firebase-admin/firestore';

import { initializeFirestore, Firestore } from 'firebase-admin/firestore';

import type { Storage } from 'firebase-admin/storage';
import type { Auth } from 'firebase-admin/auth';
import type { Messaging } from 'firebase-admin/messaging';
import { FIREBASE_CONFIG } from '../config';

import type { Timestamp } from 'firebase-admin/firestore';

// export type TimeStamp = FirebaseFirestore.Timestamp;
export type TimeStamp = Timestamp;

/**
 * eg use function await FirebaseManager.getFirestore() to get Firestore that is dynamically imported
 */
export class FirebaseServices {
  static app: App;
  static firestore: Firestore;
  static storage: Storage;
  static auth: Auth;
  static messaging: Messaging;

  //static firestoreModule = firestoreModule;

  /**
   * Gets the | App service for the default app or a given app.
   */
  static async getApp(): Promise<App> {
    if (!FirebaseServices.app) {
      const fbApp = await import('firebase-admin/app');
      FirebaseServices.app = fbApp.initializeApp(FIREBASE_CONFIG);
    }
    //admin.initializeApp(FIREBASE_CONFIG /* functions.config().firebase*/);
    return FirebaseServices.app;
  }

  /**
   * Gets the Firestore Module with preferRest: true that should
   * speed up lazy loading of Firestore
   */
  static async getFirestore() {
    await FirebaseServices.getApp();
    const fs = initializeFirestore(FirebaseServices.app, {
      preferRest: true,
    });
    return fs;
  }

  /**
   * Gets the | Firestore service for the default app or a given app.
   */
  // static async getFirestoreV1(): Promise<firestoreModule.Firestore> {
  //   await FirebaseServices.getApp(); // must initialize app first

  //   if (!FirebaseServices.firestore) {
  //     FirebaseServices.firestore = (
  //       await import('firebase-admin/firestore')
  //     ).getFirestore();
  //   }
  //   return FirebaseServices.firestore;
  // }
  /**
   * Gets the Firestore module
   */
  // static async getFirestoreModule(): Promise<typeof firestoreModule> {
  //   if (!FirebaseServices.firestoreModule) {
  //     const m = await import('firebase-admin/firestore');
  //     FirebaseServices.firestoreModule = m;
  //   }
  //   return FirebaseServices.firestoreModule;
  // }
  /**
   * Gets the Storage service for the default app or a given app.
   */
  static async getStorage(): Promise<Storage> {
    await FirebaseServices.getApp(); // must initialize app first

    if (!FirebaseServices.storage) {
      const m = await import('firebase-admin/storage');
      FirebaseServices.storage = m.getStorage();
    }
    return FirebaseServices.storage;
  }
  /**
   * Gets the Auth service for the default app or a given app.
   */
  static async getAuth(): Promise<Auth> {
    await FirebaseServices.getApp(); // must initialize app first

    if (!FirebaseServices.auth) {
      const m = await import('firebase-admin/auth');
      FirebaseServices.auth = m.getAuth();
    }
    return FirebaseServices.auth;
  }
  /**
   * Gets the Messaging service for the default app or a given app.
   */
  static async getMessaging(): Promise<Messaging> {
    await FirebaseServices.getApp(); // must initialize app first

    if (!FirebaseServices.messaging) {
      const m = await import('firebase-admin/messaging');
      FirebaseServices.messaging = m.getMessaging();
    }
    return FirebaseServices.messaging;
  }
}
