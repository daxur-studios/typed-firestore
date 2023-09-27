import { DecodedIdToken } from 'firebase-admin/auth';
import { Request as _Request } from 'express';

/**
 * OnRequest with fetched user record based on provided token
 */
export interface Request extends _Request {
  user: DecodedIdToken;
}
