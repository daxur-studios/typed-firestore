import { AuthBlockingEvent } from 'firebase-functions/v2/identity';
import { AsFirestoreRequest } from '../../models/as-firestore-request.model';
import { IUserDetailsDoc } from '../../models/user-details.model';
import { FirebaseServices } from '../../services/firebase.service';
import { BeforeCreateResponse } from 'firebase-functions/lib/common/providers/identity';

export default beforeUserSignedIn;

// export declare function beforeUserSignedIn(opts: BlockingOptions, handler: (event: AuthBlockingEvent) => BeforeSignInResponse | Promise<BeforeSignInResponse> | void | Promise<void>): BlockingFunction;

/**
 * Handles an event that is triggered before a user is signed in.
 *
 * Save the user's details to the database.
 */
async function beforeUserSignedIn(event: AuthBlockingEvent) {
  const firestore = await FirebaseServices.getFirestore();

  const uid = event.data.uid;

  const userDetails: AsFirestoreRequest<IUserDetailsDoc> = {
    uid,
    created: new Date(),
    displayName: event.data.displayName ?? null,
    email: event.data.email ?? null,
    modified: new Date(),
    photoURL: event.data.photoURL ?? null,
  };

  await firestore
    .doc(`/private/user/${uid}/details`)
    .set(userDetails, { merge: true })
    .catch((error) => {
      console.error(error);
    });

  const response: BeforeCreateResponse = {
    displayName: 'bRUNKO kERTESZ',
    photoURL: event.data.photoURL,
    emailVerified: event.data.emailVerified,
    customClaims: event.data.customClaims,
    disabled: event.data.disabled,
  };

  return response;
}
