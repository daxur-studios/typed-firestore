import { FirebaseServices } from '../../services/firebase.service';

async function listCollections(path: string) {
  const firestore = await FirebaseServices.getFirestore();

  if (!path) {
    return firestore.listCollections().then((docs) => {
      return docs;
    });
  } else {
    const docRef = firestore.doc(path);
    return docRef.listCollections().then((docs) => {
      return docs;
    });
  }
}

export default listCollections;
