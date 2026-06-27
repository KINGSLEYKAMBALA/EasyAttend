cdconst { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
require('dotenv').config();

const keyPath = path.resolve(__dirname, process.env.FIREBASE_ADMIN_KEY_PATH);
console.log('Reading key from:', keyPath);

const serviceAccount = require(keyPath);
console.log('Project ID from key:', serviceAccount.project_id);
console.log('Client email from key:', serviceAccount.client_email);
console.log('Private key starts with:', serviceAccount.private_key.substring(0, 30));
console.log('Private key length:', serviceAccount.private_key.length);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

async function test() {
  try {
    const snapshot = await db.collection('sessions').limit(1).get();
    console.log('✅ SUCCESS:', snapshot.size, 'docs found');
  } catch (err) {
    console.log('❌ FULL ERROR:', err);
  }
}

test();