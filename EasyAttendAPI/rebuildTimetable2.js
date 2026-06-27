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

const timetableEntries = [
  { courseCode: "BTRS 1206", dayOfWeek: "Monday", startTime: "7:45AM", endTime: "9:45AM", venueName: "H11" },
  { courseCode: "EDUF 1201", dayOfWeek: "Monday", startTime: "9:45AM", endTime: "11:45AM", venueName: "ODL-A" },
  { courseCode: "GEOG 1201", dayOfWeek: "Monday", startTime: "3:45PM", endTime: "5:45PM", venueName: "ODL-B" },
  { courseCode: "FREN 1201", dayOfWeek: "Monday", startTime: "12:45PM", endTime: "2:45PM", venueName: "FRENCH LAB" },
  { courseCode: "BTRS 2402", dayOfWeek: "Monday", startTime: "7:45AM", endTime: "9:45AM", venueName: "LT1" },
  { courseCode: "GEOG 2404", dayOfWeek: "Monday", startTime: "11:45AM", endTime: "1:45PM", venueName: "ODL-A" },
  { courseCode: "BTRS 2401", dayOfWeek: "Monday", startTime: "2:45PM", endTime: "4:45PM", venueName: "R" },
  { courseCode: "FREN 3601", dayOfWeek: "Monday", startTime: "7:45AM", endTime: "9:45AM", venueName: "FRENCH LAB" },
  { courseCode: "EDUF 3603", dayOfWeek: "Monday", startTime: "11:45AM", endTime: "1:45PM", venueName: "LT1" },
  { courseCode: "ENGL 3601", dayOfWeek: "Monday", startTime: "4:45PM", endTime: "6:45PM", venueName: "ENG LR" },
  { courseCode: "BTRS 1206", dayOfWeek: "Tuesday", startTime: "8:45AM", endTime: "9:45AM", venueName: "H11" },
  { courseCode: "EDUF 1201", dayOfWeek: "Tuesday", startTime: "9:45AM", endTime: "11:45AM", venueName: "ODL-A" },
  { courseCode: "GEOG 2404", dayOfWeek: "Tuesday", startTime: "5:45PM", endTime: "6:45PM", venueName: "ODL-B" },
  { courseCode: "FREN 1201", dayOfWeek: "Tuesday", startTime: "11:45AM", endTime: "1:45PM", venueName: "FRENCH LAB" },
  { courseCode: "BTRS 2401", dayOfWeek: "Tuesday", startTime: "2:45PM", endTime: "3:45PM", venueName: "ODL-C" },
  { courseCode: "EDUF 3603", dayOfWeek: "Tuesday", startTime: "11:45AM", endTime: "1:45PM", venueName: "ODL-A" },
  { courseCode: "FREN 3601", dayOfWeek: "Tuesday", startTime: "1:45PM", endTime: "3:45PM", venueName: "ODL-E" },
  { courseCode: "GEOG 1201", dayOfWeek: "Wednesday", startTime: "7:45AM", endTime: "8:45AM", venueName: "LT1" },
  { courseCode: "BTRS 2402", dayOfWeek: "Friday", startTime: "9:45AM", endTime: "10:45AM", venueName: "LT1" },
  { courseCode: "ENGL 3601", dayOfWeek: "Friday", startTime: "9:45AM", endTime: "10:45AM", venueName: "ENG LR" },
];

async function seed() {
  await clearCollection('timetable');

  const instructorsSnapshot = await db.collection('instructors').get();
  const instructors = instructorsSnapshot.docs.map((d) => d.data());

  for (const entry of timetableEntries) {
    const matchedInstructor = instructors.find((i) => i.courseCode === entry.courseCode);

    await db.collection('timetable').add({
      ...entry,
      instructorId: matchedInstructor?.employeeNumber || "UNASSIGNED",
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ ${entry.dayOfWeek} - ${entry.courseCode} (${entry.startTime}-${entry.endTime}) @ ${entry.venueName}`);
  }
  console.log("✅ Timetable rebuilt!");
}

seed();