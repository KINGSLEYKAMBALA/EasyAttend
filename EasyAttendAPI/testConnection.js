const { db } = require('./services/firebaseAdmin');

async function testConnection() {
  try {
    const snapshot = await db.collection('sessions').limit(1).get();
    console.log('✅ Connected to Firestore successfully');
    console.log(`Found ${snapshot.size} document(s) in 'sessions' collection`);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();