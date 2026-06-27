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

const courses = [
  { courseCode: "BTRS 1206", courseName: "Introduction to Theology", programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { courseCode: "EDUF 1201", courseName: "Foundations of Education", programName: "Bachelor of Education (Arts)" },
  { courseCode: "GEOG 1201", courseName: "Introduction to Geography", programName: "Bachelor of Arts (Development Studies)" },
  { courseCode: "FREN 1201", courseName: "French Language I", programName: "Bachelor of Education (Languages)" },
  { courseCode: "BTRS 2402", courseName: "Comparative Religious Studies", programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { courseCode: "GEOG 2404", courseName: "Physical Geography", programName: "Bachelor of Arts (Development Studies)" },
  { courseCode: "BTRS 2401", courseName: "Biblical Studies II", programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { courseCode: "FREN 3601", courseName: "French Language III", programName: "Bachelor of Education (Languages)" },
  { courseCode: "EDUF 3603", courseName: "Educational Psychology", programName: "Bachelor of Education (Arts)" },
  { courseCode: "ENGL 3601", courseName: "English Literature", programName: "Bachelor of Education (Languages)" },
];

function parseLevelSemester(courseCode) {
  const digits = courseCode.match(/\d+/)?.[0] || "";
  const classLevel = digits.length >= 1 ? parseInt(digits[0]) : null;
  const semester = digits.length >= 2 ? parseInt(digits[1]) : null;
  return { classLevel, semester };
}

async function seed() {
  await clearCollection('courses');
  for (const course of courses) {
    const { classLevel, semester } = parseLevelSemester(course.courseCode);
    await db.collection('courses').add({
      ...course,
      classLevel,
      semester,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ ${course.courseCode} (Level ${classLevel}, Sem ${semester})`);
  }
  console.log("✅ Courses rebuilt!");
}

seed();