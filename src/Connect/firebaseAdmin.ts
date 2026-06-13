import admin from "firebase-admin";


if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: "learner-space-e08d4.firebasestorage.app",
  });
}

const bucket = admin.storage().bucket();
export default bucket;
