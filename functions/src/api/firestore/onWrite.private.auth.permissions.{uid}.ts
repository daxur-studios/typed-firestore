import * as functions from 'firebase-functions';
import { FirebaseServices } from '../../services/firebase.service';
import {
  AllUserPermissions,
  IUserPermissionsDoc,
  UserPermissionEnum,
} from '../../models/permissions.model';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { FirestoreEvent, Change } from 'firebase-functions/v2/firestore';
import { AsFirestoreRequest } from '../../models/as-firestore-request.model';

export default ManageUserPermissions;

/**
 * Manage What Features the user can use, such as text-prompts, text-to-speech, image-prompts, etc.
 */
async function ManageUserPermissions(
  change: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      uid: string;
    }
  >
) {
  const auth = await FirebaseServices.getAuth();
  const firestore = await FirebaseServices.getFirestore();

  await firestore.doc('private/auth').set({
    userPermissionsModified: new Date(),
  });

  const cloudEvent = change.data;

  const afterData = cloudEvent?.after.data() as
    | Partial<IUserPermissionsDoc>
    | undefined;
  const beforeData = cloudEvent?.before.data() as
    | Partial<IUserPermissionsDoc>
    | undefined;

  const uid = change.params.uid;

  const writeType =
    cloudEvent?.after.exists && cloudEvent?.before.exists
      ? 'updated'
      : cloudEvent?.after.exists && !cloudEvent.before.exists
      ? 'created'
      : 'deleted';

  const afterDataPermissions: AllUserPermissions = {
    [UserPermissionEnum.isAdmin]:
      afterData?.permissions?.[UserPermissionEnum.isAdmin] ?? false,
  };

  if (writeType === 'updated') {
    const promises: Promise<any>[] = [];

    const hasChangedPermissions = Object.keys(afterDataPermissions).some(
      (permission) => {
        const key = permission as keyof AllUserPermissions;
        return afterDataPermissions[key] !== beforeData?.permissions?.[key];
      }
    );

    if (hasChangedPermissions) {
      promises.push(
        auth
          .setCustomUserClaims(uid, {
            ...afterDataPermissions,
          })
          .catch((e) => {
            functions.logger.error(e);
            return null;
          })
      );
      promises.push(
        auth.revokeRefreshTokens(uid).catch((e) => {
          functions.logger.error(e);
          return null;
        })
      );
    }
    await Promise.all(promises);
    return null;
  } else {
    // rest of code is only ran if write type !== updated
    const user = await auth
      .getUser(uid)
      .then((userObj) => {
        return userObj;
      })
      .catch(() => {
        return null;
      });

    if (writeType === 'created') {
      return auth
        .setCustomUserClaims(uid, {
          ...afterDataPermissions,
        })
        .then(() => {
          const updateRequest: AsFirestoreRequest<IUserPermissionsDoc> = {
            permissions: {
              ...afterDataPermissions,
            },
            createdAt: new Date(),
            displayName: user?.displayName ?? null,
            email: user?.email ?? null,
            uid: user?.uid ?? null,
          };

          cloudEvent?.after.ref.update(updateRequest).catch((e) => {
            console.error(e);
            functions.logger.error(e);
          });

          return {
            result: `Request fulfilled. ${uid} is now authorized!`,
          };
        });
    } else if (writeType === 'deleted') {
      const deletedPromises: Promise<any>[] = [];

      deletedPromises.push(
        auth.revokeRefreshTokens(uid).catch((e) => {
          functions.logger.error(e);
          return null;
        })
      );

      const permissionSet: AllUserPermissions = {
        [UserPermissionEnum.isAdmin]: false,
      };

      deletedPromises.push(
        auth
          .setCustomUserClaims(uid, permissionSet)
          .then(() => {
            return {
              result: `Request fulfilled. ${uid} is no longer authorized!`,
            };
          })
          .catch((e) => {
            functions.logger.error(e);
            return {
              result: e,
            };
          })
      );

      await Promise.all(deletedPromises);
      return null;
    } else {
      return null;
    }
  }
}
