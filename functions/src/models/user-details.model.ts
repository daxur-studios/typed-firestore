import type { Timestamp } from 'firebase-admin/firestore';

export interface IUserDetailsDoc {
  modified: Timestamp;
  created: Timestamp;

  uid: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
}
