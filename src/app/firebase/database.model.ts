export enum FirestoreFieldTypeEnum {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Timestamp = 'timestamp',
}

export const DatabaseFieldTypeOptions = [
  FirestoreFieldTypeEnum.String,
  FirestoreFieldTypeEnum.Number,
  FirestoreFieldTypeEnum.Boolean,
  FirestoreFieldTypeEnum.Array,
  FirestoreFieldTypeEnum.Object,
  FirestoreFieldTypeEnum.Timestamp,
] as const;

export interface IFirebaseConfig {
  projectId: string;
  appId: string;
  storageBucket: string;
  locationId: string;
  apiKey: string;
  authDomain: string;
  messagingSenderId: string;
  measurementId: string;
  useEmulators: boolean;
}
