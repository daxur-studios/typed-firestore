import type { UserRecord } from 'firebase-admin/auth';
import { FirebaseServices } from '../../services/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';

export default UserOnDelete;

async function UserOnDelete(user: UserRecord) {
  const firestore = await FirebaseServices.getFirestore();

  const uid = user.uid;

  await firestore
    .doc(`/private/user/${uid}/details`)
    .delete()
    .catch((error) => {
      console.error(error);
    });

  await firestore
    .doc(`private/user`)
    .set(
      {
        OnDeleteCount: FieldValue.increment(-1),
        totalUsers: FieldValue.increment(-1),
        modified: new Date(),
      },
      { merge: true }
    )
    .catch((error) => {
      console.error(error);
    });
}
