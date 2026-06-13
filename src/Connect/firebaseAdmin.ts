import admin from "firebase-admin";


if (!admin.apps.length) {
  admin.initializeApp();
}

const bucket = admin.storage().bucket();
export default bucket;
