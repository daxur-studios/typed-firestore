import { FirebaseServices } from '../../services/firebase.service';

async function deleteCollection(path: string) {
  const firestore = await FirebaseServices.getFirestore();

  const collectionRef = firestore.collection(path);
  const query = collectionRef.limit(500);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(firestore, query, resolve, reject);
  });
}

export default deleteCollection;

async function deleteQueryBatch(
  firestore: typeof FirebaseServices.firestore,
  query: FirebaseFirestore.Query,
  resolve: (value: any) => unknown,
  reject: (error: Error) => void
) {
  const snapshot = await query.get();

  // When there are no documents left, we are done
  if (snapshot.size === 0) {
    resolve(true);
    return;
  }

  // Delete documents in a batch
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(firestore, query, resolve, reject);
  });
}
