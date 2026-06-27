const { db } = require('./services/firebaseAdmin');

const courses = [
  { courseCode: "BTRS 1206", courseName: "Introduction to Theology" },
  { courseCode: "EDUF 1201", courseName: "Foundations of Education" },
  { courseCode: "GEOG 1201", courseName: "Introduction to Geography" },
  { courseCode: "FREN 1201", courseName: "French Language I" },
  { courseCode: "BTRS 2402", courseName: "Comparative Religious Studies" },
  { courseCode: "GEOG 2404", courseName: "Physical Geography" },
  { courseCode: "BTRS 2401", courseName: "Biblical Studies II" },
  { courseCode: "FREN 3601", courseName: "French Language III" },
  { courseCode: "EDUF 3603", courseName: "Educational Psychology" },
  { courseCode: "ENGL 3601", courseName: "English Literature" },
];

async function seed() {
  for (const course of courses) {
    const existing = await db.collection('courses')
      .where('courseCode', '==', course.courseCode)
      .limit(1).get();

    if (!existing.empty) {
      console.log(`⏭  Skipped (exists): ${course.courseCode}`);
      continue;
    }

    await db.collection('courses').add({
      ...course,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Added: ${course.courseCode} - ${course.courseName}`);
  }
  console.log("✅ Real courses seeded!");
}

seed();