const { db } = require('./services/firebaseAdmin');

const timetableEntries = [
  { day: "Monday", courseCode: "BTRS 1206", venue: "H11", startTime: "7:45AM", endTime: "9:45AM" },
  { day: "Monday", courseCode: "EDUF 1201", venue: "ODL-A", startTime: "9:45AM", endTime: "11:45AM" },
  { day: "Monday", courseCode: "GEOG 1201", venue: "ODL-B", startTime: "3:45PM", endTime: "5:45PM" },
  { day: "Monday", courseCode: "FREN 1201", venue: "FRENCH LAB", startTime: "12:45PM", endTime: "2:45PM" },
  { day: "Monday", courseCode: "BTRS 2402", venue: "LT1", startTime: "7:45AM", endTime: "9:45AM" },
  { day: "Monday", courseCode: "GEOG 2404", venue: "ODL-A", startTime: "11:45AM", endTime: "1:45PM" },
  { day: "Monday", courseCode: "BTRS 2401", venue: "R", startTime: "2:45PM", endTime: "4:45PM" },
  { day: "Monday", courseCode: "FREN 3601", venue: "FRENCH LAB", startTime: "7:45AM", endTime: "9:45AM" },
  { day: "Monday", courseCode: "EDUF 3603", venue: "LT1", startTime: "11:45AM", endTime: "1:45PM" },
  { day: "Monday", courseCode: "ENGL 3601", venue: "ENG LR", startTime: "4:45PM", endTime: "6:45PM" },
  { day: "Monday", courseCode: "FREN 1201", venue: "ODEL COMPUTER LAB", startTime: "7:45AM", endTime: "9:45AM" },
  { day: "Monday", courseCode: "BTRS 1206", venue: "ODL-C", startTime: "11:45AM", endTime: "1:45PM" },
  { day: "Monday", courseCode: "GEOG 1201", venue: "ODL-B", startTime: "5:45PM", endTime: "6:45PM" },
  { day: "Monday", courseCode: "ENGL 3601", venue: "ODL-C", startTime: "3:45PM", endTime: "4:45PM" },
  { day: "Monday", courseCode: "BTRS 2401", venue: "ODL-D", startTime: "11:45AM", endTime: "1:45PM" },
  { day: "Monday", courseCode: "EDUF 1201", venue: "ODL-A", startTime: "1:45PM", endTime: "3:45PM" },
  { day: "Monday", courseCode: "EDUF 3603", venue: "LT1", startTime: "3:45PM", endTime: "5:45PM" },
  { day: "Tuesday", courseCode: "BTRS 1206", venue: "H11", startTime: "8:45AM", endTime: "9:45AM" },
  { day: "Tuesday", courseCode: "FREN 1201", venue: "FRENCH LAB", startTime: "11:45AM", endTime: "1:45PM" },
  { day: "Tuesday", courseCode: "BTRS 2401", venue: "ODL-C", startTime: "2:45PM", endTime: "3:45PM" },
  { day: "Tuesday", courseCode: "GEOG 2404", venue: "ODL-B", startTime: "5:45PM", endTime: "6:45PM" },
  { day: "Tuesday", courseCode: "EDUF 1201", venue: "ODL-A", startTime: "9:45AM", endTime: "11:45AM" },
  { day: "Tuesday", courseCode: "BTRS 1206", venue: "ODL-F", startTime: "2:45PM", endTime: "3:45PM" },
  { day: "Tuesday", courseCode: "FREN 1201", venue: "ODL-B", startTime: "5:45PM", endTime: "6:45PM" },
  { day: "Tuesday", courseCode: "BTRS 2401", venue: "ODL-F", startTime: "4:45PM", endTime: "5:45PM" },
  { day: "Tuesday", courseCode: "EDUF 3603", venue: "ODL-A", startTime: "11:45AM", endTime: "1:45PM" },
  { day: "Tuesday", courseCode: "FREN 3601", venue: "ODL-E", startTime: "1:45PM", endTime: "3:45PM" },
  { day: "Tuesday", courseCode: "EDUF 1201", venue: "ODL-B", startTime: "1:45PM", endTime: "3:45PM" },
  { day: "Tuesday", courseCode: "EDUF 3603", venue: "ODL-B", startTime: "3:45PM", endTime: "5:45PM" },
  { day: "Wednesday", courseCode: "GEOG 1201", venue: "LT1", startTime: "7:45AM", endTime: "8:45AM" },
  { day: "Friday", courseCode: "BTRS 2402", venue: "LT1", startTime: "9:45AM", endTime: "10:45AM" },
  { day: "Friday", courseCode: "ENGL 3601", venue: "ENG LR", startTime: "9:45AM", endTime: "10:45AM" },
  { day: "Friday", courseCode: "ENGL 3601", venue: "ODL-E", startTime: "11:45AM", endTime: "1:45PM" },
  { day: "Sunday", courseCode: "GEOG 2404", venue: "ODL-B", startTime: "11:45AM", endTime: "1:45PM" },
];

async function seed() {
  const coursesSnapshot = await db.collection('courses').get();
  const courses = coursesSnapshot.docs.map((d) => d.data());

  let added = 0;
  let skipped = 0;

  for (const entry of timetableEntries) {
    const existing = await db.collection('timetable')
      .where('courseCode', '==', entry.courseCode)
      .where('day', '==', entry.day)
      .where('startTime', '==', entry.startTime)
      .limit(1).get();

    if (!existing.empty) {
      skipped++;
      continue;
    }

    const matchedCourse = courses.find((c) => c.courseCode === entry.courseCode);

    await db.collection('timetable').add({
      ...entry,
      courseName: matchedCourse?.courseName || "Unknown",
      createdAt: new Date().toISOString(),
    });
    added++;
    console.log(`✅ ${entry.day} - ${entry.courseCode} (${entry.startTime}-${entry.endTime}) @ ${entry.venue}`);
  }

  console.log(`\n✅ Done! Added: ${added}, Skipped (duplicates): ${skipped}`);
}

seed();