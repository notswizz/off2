import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function initializeFirebase() {
  if (admin.apps.length) {
    return admin.firestore();
  }

  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountStr) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT env var not set');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase initialized successfully');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    return null;
  }
}

export const db = initializeFirebase();
export default admin;
