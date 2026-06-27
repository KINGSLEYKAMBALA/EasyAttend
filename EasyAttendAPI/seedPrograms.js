const { db } = require('./services/firebaseAdmin');

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
  for (const name of programs) {
    const existing = await db.collection('programs')
      .where('name', '==', name)
      .limit(1).get();

    if (!existing.empty) {
      console.log(`⏭  Skipped (exists): ${name}`);
      continue;
    }

    await db.collection('programs').add({
      name,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Added: ${name}`);
  }
  console.log("✅ Programs seeded!");
}

seed();