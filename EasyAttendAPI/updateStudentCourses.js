const { db } = require('./services/firebaseAdmin');

const REAL_COURSE_CODES = [
  "BTRS 1206",
  "EDUF 1201",
  "GEOG 1201",
  "FREN 1201",
  "BTRS 2402",
  "GEOG 2404",
  "BTRS 2401",
  "FREN 3601",
  "EDUF 3603",
  "ENGL 3601",
];

async function updateStudents() {
  const snapshot = await db.collection('students').get();

  if (snapshot.empty) {
    console.log("No students found.");
    return;
  }

  const students = snapshot.docs;
  console.log(`Found ${students.length} students. Assigning real course codes...`);

  let updated = 0;

  for (let i = 0; i < students.length; i++) {
    const doc = students[i];
    const courseCode = REAL_COURSE_CODES[i % REAL_COURSE_CODES.length];

    await db.collection('students').doc(doc.id).update({
      courseCode: courseCode,
    });

    const data = doc.data();
    console.log(`✅ ${data.name || doc.id} → ${courseCode}`);
    updated++;
  }

  console.log(`\n✅ Done! Updated ${updated} students with real course codes.`);
}

updateStudents();