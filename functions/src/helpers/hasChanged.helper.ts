import type { DocumentReference } from 'firebase-admin/firestore';
import { isEqual, get } from 'lodash';

export type HasChangedParams<T> = {
  docRef: DocumentReference;
  beforeData: T;
  afterData: T;
  writeType: 'created' | 'updated' | 'deleted';
};

export function hasChanged<T = any>(params: HasChangedParams<T>, key: keyof T) {
  const afterData = params.afterData;
  const beforeData = params.beforeData;

  return !isEqual(get(afterData, key), get(beforeData, key));
}

export function hasDocumentChanged(controller: HasChangedParams<any>) {
  if (controller.writeType === 'created') {
    return true;
  }

  // Otherwise these keys can cause infinite loops
  const keysToIgnore = ['updatedAt'];

  const keysToCheck = Object.keys(controller.afterData || {}).filter(
    (key) => !keysToIgnore.includes(key)
  );

  return keysToCheck.some((key) => hasChanged(controller, key));
}
