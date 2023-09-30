import type { Timestamp } from 'firebase-admin/firestore';

type NonNullableKeys<T> = {
  [P in keyof T]: undefined extends T[P] ? never : P;
}[keyof T];

type NullableKeys<T> = {
  [P in keyof T]: undefined extends T[P] ? P : never;
}[keyof T];

/**
 * Convert a Firestore Document Interface's types compatible to saving data in firestore.
 * For example,
 * - If an interface has Timestamps, this will convert them to Date.
 * - `undefined` or optional properties will be converted to `null`, as Firestore does not support undefined.
 * - If an interface has nested objects, this will convert them to AsFirestoreRequest.
 *
 * @example
 * interface ITest {
 *  name: string;
 *  createdAt: Timestamp;
 *  optional?: string | undefined;
 * };
 *
 * const test: AsFirestoreRequest<ITest> = {
 *  name: 'test',
 *  createdAt: new Date(),
 *  optional: null,
 * };
 */
export type AsFirestoreRequest<T> = {
  [P in NonNullableKeys<T>]: T[P] extends Timestamp
    ? Date
    : T[P] extends object
    ? AsFirestoreRequest<T[P]>
    : T[P];
} & {
  [P in NullableKeys<T>]: T[P] extends Timestamp
    ? Date
    : T[P] extends object
    ? AsFirestoreRequest<T[P]>
    : T[P] extends Timestamp | undefined
    ? Date | null
    : NonNullable<T[P]> | null;
};
