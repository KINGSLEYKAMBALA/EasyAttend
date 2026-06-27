// EasyAttendAPI/seedDatabase.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json'); 
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 1. Decoded 10 Exact Courses from your Mzuzu University Timetable Sheets
const selectedCourses = [
  { courseCode: "EDUF 1201", courseName: "Philosophy of Education", startTime: "09:45AM", endTime: "11:45AM", venueName: "ODL-A", dayOfWeek: "Monday", program: "BEDA" },
  { courseCode: "BTRS 1206", courseName: "Hospitality Management Systems", startTime: "07:45AM", endTime: "09:45AM", venueName: "H11", dayOfWeek: "Monday", program: "BTRS" },
  { courseCode: "GEOG 1201", courseName: "Introduction to Physical Geography", startTime: "03:45PM", endTime: "05:45PM", venueName: "ODL-B", dayOfWeek: "Monday", program: "BEDA" },
  { courseCode: "BTRS 1202", courseName: "Introduction to Tourism Business", startTime: "04:45PM", endTime: "06:45PM", venueName: "ODL-B", dayOfWeek: "Tuesday", program: "BTRS" },
  { courseCode: "GEOG 1202", courseName: "Human Geography", startTime: "09:45AM", endTime: "11:45AM", venueName: "ENG LR", dayOfWeek: "Tuesday", program: "BEDA" },
  { courseCode: "EDUF 2402", courseName: "Sociology of Education", startTime: "07:45AM", endTime: "09:45AM", venueName: "BEDA LR", dayOfWeek: "Thursday", program: "BEDL" },
  { courseCode: "BTRS 2402", courseName: "Sustainable Tourism Development", startTime: "09:45AM", endTime: "11:45AM", venueName: "H11", dayOfWeek: "Friday", program: "BTRS" },
  { courseCode: "EDUF 4705", courseName: "Educational Administration and Management", startTime: "07:45AM", endTime: "09:45AM", venueName: "Main Hall", dayOfWeek: "Wednesday", program: "BEDF" },
  { courseCode: "EDUF 4722", courseName: "Educational Research Methods", startTime: "01:45PM", endTime: "03:45PM", venueName: "BEIT CLASSROOM", dayOfWeek: "Monday", program: "BEDICT" },
  { courseCode: "BDEV 4801", courseName: "Development Policy Analysis", startTime: "01:45PM", endTime: "03:45PM", venueName: "BEIT RESOURCE ROOM", dayOfWeek: "Saturday", program: "BEDA" }
];

// 2. Exact Group of 40 Students using your structural Mzuni Reg Number formats
const studentsDataset = [
  // BEDICT Program (14 Students)
  ...Array.from({ length: 14 }, (_, i) => ({ regNumber: `bedict1522${String(i+1).padStart(2,'0')}`, name: `Student Alumnus ${i+1}`, levelOfStudy: "1", program: "BEDICT" })),
  // BTRS Program (13 Students)
  ...Array.from({ length: 13 }, (_, i) => ({ regNumber: `btrs0223${String(i+1).padStart(2,'0')}`, name: `Tourism Scholar ${i+1}`, levelOfStudy: "2", program: "BTRS" })),
  // EDUF Level 4 Program (13 Students)
  ...Array.from({ length: 13 }, (_, i) => ({ regNumber: `eduf4722${String(i+1).padStart(2,'0')}`, name: `Education Specialist ${i+1}`, levelOfStudy: "4", program: "BEDA" }))
];

async function seedDatabase() {
  console.log("🚀 Initializing shared data synchronization from EasyAttendAPI...");

  // Write Timetable raw definitions to 'timetable' collection so mobile can look up times/venues
  for (const c of selectedCourses) {
    await db.collection('timetable').doc(c.courseCode).set({
      courseCode: c.courseCode,
      courseName: c.courseName,
      startTime: c.startTime,
      endTime: c.endTime,
      venueName: c.venueName,
      dayOfWeek: c.dayOfWeek
    });
  }

  // Write all 40 individual Student documents to 'students' collection
  for (const student of studentsDataset) {
    await db.collection('students').doc(student.regNumber).set(student);
  }

  // Create Courses map and link EXACTLY 10 students matching their scope fields
  for (const item of selectedCourses) {
    let matchedRegs = studentsDataset
      .filter(s => s.program === item.program || s.regNumber.substring(0, 4) === item.courseCode.substring(0, 4).toLowerCase())
      .map(s => s.regNumber);

    // Ensure every single course gets exactly 10 registered entries
    if (matchedRegs.length < 10) {
      const uniqueBackups = studentsDataset.map(s => s.regNumber).filter(id => !matchedRegs.includes(id));
      while (matchedRegs.length < 10 && uniqueBackups.length > 0) {
        matchedRegs.push(uniqueBackups.pop());
      }
    }
    matchedRegs = matchedRegs.slice(0, 10);

    // Set course mapping
    await db.collection('courses').doc(item.courseCode).set({
      courseCode: item.courseCode,
      courseName: item.courseName,
      instructorId: "EMP02026", // Link directly to the active Instructor account
      registeredStudents: matchedRegs
    });
  }

  // Create Instructor account document matching your exact email requirement
  await db.collection('instructors').doc("EMP02026").set({
    employeeNumber: "EMP02026",
    name: "Dr. Mzuni Instructor",
    email: "you@mzuni.ac.mw"
  });

  console.log("✅ Data successfully linked in Firestore! 10 Courses, 40 Students configured with exact Mzuni codes.");
}

seedDatabase().catch(console.error);