/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from 'firebase-functions/logger';
import * as functions from 'firebase-functions';
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import {
  beforeUserCreated,
  beforeUserSignedIn,
} from 'firebase-functions/v2/identity';
import { baseRegion } from './config';
import { throwIfNoPermissionCallable } from './helpers';
import { UserPermissionEnum } from './models/permissions.model';

export const helloWorld = onRequest(
  { region: baseRegion },
  (request, response) => {
    logger.info('Hello logs!', { structuredData: true });

    response.send('Hello from Firebase! 🐲');
  }
);

export const listCollections = onCall<{ path: string }>(
  { region: baseRegion, cors: true },
  async (request) => {
    throwIfNoPermissionCallable(request, UserPermissionEnum.isAdmin);

    const collections = await import('./api/callable/listCollections').then(
      async ({ default: listCollections }) => {
        return await listCollections(request.data.path);
      }
    );

    return collections.map((collection) => collection.path);
  }
);

export const deleteCollection = onCall<{ path: string }>(
  { region: baseRegion, cors: true },
  async (request) => {
    throwIfNoPermissionCallable(request, UserPermissionEnum.isAdmin);

    return await import('./api/callable/deleteCollection').then(
      async ({ default: deleteCollection }) => {
        return await deleteCollection(request.data.path);
      }
    );
  }
);

//#region USER PERMISSIONS

export const ManageUserPermissions = onDocumentWritten(
  { document: 'private/auth/permissions/{uid}', region: baseRegion },
  async (change) => {
    return await import(
      './api/firestore/onWrite.private.auth.permissions.{uid}'
    ).then(async ({ default: ManageUserPermissions }) => {
      return await ManageUserPermissions(change);
    });
  }
);
//#endregion

//#region USER BLOCKING FUNCTIONS

export const beforeCreated = beforeUserCreated(
  { region: baseRegion },
  async (event) => {
    const x = import('./api/identity/beforeUserCreated').then(
      async ({ default: beforeUserCreated }) => {
        return beforeUserCreated(event);
      }
    );

    return await x;
  }
);

export const beforeSignedIn = beforeUserSignedIn(
  { region: baseRegion },
  async (event) => {
    const x = import('./api/identity/beforeUserSignedIn').then(
      async ({ default: beforeUserSignedIn }) => {
        return beforeUserSignedIn(event);
      }
    );

    return await x;
  }
);

/** Responds to the creation of a Firebase Auth user. */
export const UserOnCreate = functions
  .region(baseRegion)
  .auth.user()
  .onCreate(async (user) => {
    await (await import('./api/auth/user.OnCreate')).default(user);
  });

/** Responds to the deletion of a Firebase Auth user. */
export const auth_onDelete = functions
  .region(baseRegion)
  .auth.user()
  .onDelete(async (user) => {
    await (await import('./api/auth/user.OnDelete')).default(user);
  });

//#endregion
