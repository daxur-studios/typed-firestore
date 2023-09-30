import type { Timestamp } from 'firebase-admin/firestore';

export enum UserPermissionEnum {
  isAdmin = 'isAdmin',
}

export interface IUserPermissionsDoc {
  permissions: AllUserPermissions;

  // Added after the document was created
  uid?: string;
  email?: string;
  displayName?: string;
  createdAt?: Timestamp;
}

export type AllUserPermissions = {
  [v in UserPermissionEnum]: boolean | null;
};
