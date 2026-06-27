const { db } = require('./services/firebaseAdmin');

async function clearCollection(name) {
  const snapshot = await db.collection(name).get();
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    docs.slice(i, i + 400).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log(`Cleared ${docs.length} old docs from '${name}'`);
}

const programs = [
  "Bachelor of Arts (Theology and Religious Studies)",
  "Bachelor of Education (Arts)",
  "Bachelor of Education (Information and Communication Technology)",
  "Bachelor of Education (Languages)",
  "Bachelor of Education (Science)",
  "Bachelor of Arts (Communication Studies)",
  "Bachelor of Arts (Development Studies)",
  "Bachelor of Arts (History and Heritage Studies)",
  "Bachelor of Arts (International Relations and Diplomacy)",
  "Bachelor of Library and Information Science",
];

async function seed() {
  await clearCollection('programs');
  for (const name of programs) {
    await db.collection('programs').add({ name, createdAt: new Date().toISOString() });
    console.log(`✅ ${name}`);
  }
  console.log("✅ Programs rebuilt!");
}

seed();