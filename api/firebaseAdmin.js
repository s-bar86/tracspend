// firebaseAdmin.js
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app;
if (!global._firebaseAdminApp) {
  app = initializeApp({
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS))
      : applicationDefault(),
  });
  global._firebaseAdminApp = app;
} else {
  app = global._firebaseAdminApp;
}

export const adminAuth = getAuth(app);
