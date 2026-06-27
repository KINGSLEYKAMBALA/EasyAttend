const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config();

const keyPath = path.resolve(__dirname, '..', process.env.FIREBASE_ADMIN_KEY_PATH);
const serviceAccount = require(keyPath);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

module.exports = { db };