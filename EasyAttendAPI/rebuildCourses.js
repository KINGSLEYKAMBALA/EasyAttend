const { db } = require('./services/firebaseAdmin');

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
  const level = digits.length >= 1 ? parseInt(digits[0]) : null;
  const semester = digits.length >= 2 ? parseInt(digits[1]) : null;
  return { level, semester };
}

async function seed() {
  for (const course of courses) {
    const { level, semester } = parseLevelSemester(course.courseCode);

    const existing = await db.collection('courses')
      .where('courseCode', '==', course.courseCode)
      .limit(1).get();

    const courseData = { ...course, level, semester };

    if (!existing.empty) {
      await db.collection('courses').doc(existing.docs[0].id).update(courseData);
      console.log(`🔄 Updated: ${course.courseCode} (Level ${level}, Sem ${semester})`);
    } else {
      await db.collection('courses').add({
        ...courseData,
        createdAt: new Date().toISOString(),
      });
      console.log(`✅ Added: ${course.courseCode} (Level ${level}, Sem ${semester})`);
    }
  }
  console.log("✅ Courses rebuilt with level/semester/program!");
}

seed();