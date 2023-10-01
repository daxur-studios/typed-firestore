import type { UserRecord } from 'firebase-admin/auth';
import { AsFirestoreRequest } from '../../models/as-firestore-request.model';
import { IUserDetailsDoc } from '../../models/user-details.model';
import { FirebaseServices } from '../../services/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';
import { IUserPermissionsDoc } from '../../models/permissions.model';

export default UserOnCreate;

async function UserOnCreate(user: UserRecord) {
  const firestore = await FirebaseServices.getFirestore();

  const uid = user.uid;

  const userDetails: AsFirestoreRequest<IUserDetailsDoc> = {
    uid,
    created: new Date(),
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    modified: new Date(),
    photoURL: user.photoURL ?? null,
  };

  await firestore
    .doc(`private/user/${uid}/details`)
    .set(userDetails, { merge: true })
    .catch((error) => {
      console.error(error);
    });

  const permissionsDoc: AsFirestoreRequest<IUserPermissionsDoc> = {
    createdAt: new Date(),
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    permissions: {
      isAdmin: false,
    },
    uid,
  };

  await firestore
    .doc(`private/auth/permissions/${uid}`)
    .set(permissionsDoc, { merge: true })
    .catch((error) => {
      console.error(error);
    });

  await firestore
    .doc(`private/user`)
    .set(
      {
        OnCreateCount: FieldValue.increment(1),
        totalUsers: FieldValue.increment(1),
        modified: new Date(),
      },
      { merge: true }
    )
    .catch((error) => {
      console.error(error);
    });
}
