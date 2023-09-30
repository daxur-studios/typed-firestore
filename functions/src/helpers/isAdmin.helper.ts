import * as functions from 'firebase-functions';
import { projectDomain } from '../config';
import { Request } from '../models/request.model';
import { UserPermissionEnum } from '../models/permissions.model';
import { FirebaseServices } from '../services/firebase.service';
import { hasDocumentChanged } from './hasChanged.helper';
import { HasChangedParams } from './hasChanged.helper';

import { Response } from 'express';

/**
 * Used to validate callable functions , that are only supposed to be used by admins with correct Custom Claims
 */
export function throwIfNotAdmin(context: functions.https.CallableContext) {
  if (context?.auth?.token?.isAdmin !== true) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Request not authorized, user must be an admin on "${projectDomain}" to call this function. ${context.auth?.uid}`
    );
  }
}

export function throwIfNoPermissionCallable(
  context: functions.https.CallableContext,
  permission: UserPermissionEnum
) {
  if (context?.auth?.token?.[permission] !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Request not authorized, user must have "${permission}" permission to call this function. ${context.auth?.uid}`
    );
  }
}

export function hasPermissionOnRequest(
  response: Response,
  request: Request,
  permission: UserPermissionEnum
) {
  if (request?.user?.[permission] !== true) {
    response
      .status(403)
      .send(
        `Request not authorized, user must have "${permission}" permission to call this function. UID: ${request.user?.uid}`
      );
    response.end();
    return false;
  }
  return true;
  //   throw new functions.https.HttpsError(
  //     'permission-denied',
  //     `Request not authorized, user must have "${permission}" permission to call this function. ID: ${request.user?.uid}`
  //   );
  // }
}

/**
 * ONLY USE THIS FOR FIRESTORE TRIGGERS, where the uid is the document id, so its safe to use it
 *
 * WARNING - CAN CAUSE INFINITE LOOP IF NOT USED CORRECTLY
 */
export async function throwIfNoPermissionFirestoreTrigger(
  controller: HasChangedParams<any>,
  uid: string,
  permission: UserPermissionEnum
) {
  const changed = hasDocumentChanged(controller);

  if (changed === false) {
    return;
  }

  if (
    uid !== controller.docRef.parent?.parent?.parent?.parent?.parent.id // /list -> prompts -> {modelId} -> ai -> {userId}
  ) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Request not authorized, Mismatch between provided ui and parent uid.\nProvided ui: ${uid}\nProvided path: ${controller.docRef.path}`
    );
  }

  const userRecord = await getUserRecordByUid(uid);

  if (userRecord?.customClaims?.[permission] !== true) {
    const errorMessage = `Request not authorized, user must have "${permission}" permission to call this function. ${userRecord?.uid}`;

    await controller.docRef.set(
      {
        error: errorMessage,
        updatedAt: new Date(),
        docRef: {
          id: controller.docRef.id,
          path: controller.docRef.path,
        },
      },
      { merge: true }
    );

    throw new functions.https.HttpsError('failed-precondition', errorMessage);
  }
}

/**
 * Contains custom claims for user
 */
export async function getUserRecordByUid(uid: string) {
  const auth = await FirebaseServices.getAuth();

  const userRecord = await auth.getUser(uid);

  return userRecord;
}
