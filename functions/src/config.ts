import { SupportedRegion } from 'firebase-functions/v2/options';

export const FIREBASE_CONFIG: {
  projectId: string;
  storageBucket: string;
} = JSON.parse(process.env['FIREBASE_CONFIG'] || '{}');

// Whether we are running in the emulator or not
export const isEmulated = process?.env?.['FUNCTIONS_EMULATOR'] === 'true';
export const projectDomain = isEmulated
  ? 'http://localhost:4200'
  : `https://${FIREBASE_CONFIG.projectId}.web.app`;

export const projectDomain2 = isEmulated
  ? 'http://localhost:4200'
  : `https://${FIREBASE_CONFIG.projectId}.firebaseapp.com`;

export const baseRegion: SupportedRegion = 'europe-west2';

// gs://brunos-assistant.appspot.com/
export const bucket = isEmulated
  ? 'default-bucket'
  : FIREBASE_CONFIG.storageBucket;
