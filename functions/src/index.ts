/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from 'firebase-functions/logger';
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { baseRegion } from './config';
import { throwIfNoPermissionCallable } from './helpers';
import { UserPermissionEnum } from './permissions.model';

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
