const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  writeBatch
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBXu48Sc17V64gFvakIPHDG9LzEu_9sfF4",
  authDomain: "easyattend-b2bc0.firebaseapp.com",
  projectId: "easyattend-b2bc0",
  storageBucket: "easyattend-b2bc0.firebasestorage.app",
  messagingSenderId: "164166265539",
  appId: "1:164166265539:web:0abaafb782afc5044dd076",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 40 students
const students = [
  { regNumber: "BEDICT1522", fullName: "Kingsley Kambala", programme: "BEDICT", year: 4, gender: "Male" },
  { regNumber: "BEDICT1523", fullName: "Linton Chimkwitha", programme: "BEDICT", year: 4, gender: "Male" },
  { regNumber: "BEDICT1524", fullName: "Chisomo Banda", programme: "BEDICT", year: 4, gender: "Female" },
  { regNumber: "BEDICT1525", fullName: "Takondwa Phiri", programme: "BEDICT", year: 4, gender: "Male" },
  { regNumber: "BEDICT1526", fullName: "Mercy Mwale", programme: "BEDICT", year: 4, gender: "Female" },
  { regNumber: "BEDICT1527", fullName: "Kondwani Tembo", programme: "BEDICT", year: 4, gender: "Male" },
  { regNumber: "BEDICT1528", fullName: "Tiwonge Chirwa", programme: "BEDICT", year: 4, gender: "Female" },
  { regNumber: "BEDICT1529", fullName: "Mphatso Gondwe", programme: "BEDICT", year: 4, gender: "Male" },
  { regNumber: "BEDICT1530", fullName: "Fyawupi Mbewe", programme: "BEDICT", year: 4, gender: "Female" },
  { regNumber: "BEDICT1531", fullName: "Wezzie Lungu", programme: "BEDICT", year: 4, gender: "Female" },
  { regNumber: "BICT1522", fullName: "Tadala Chavula", programme: "BICT", year: 4, gender: "Female" },
  { regNumber: "BICT1523", fullName: "Dalitso Mkandawire", programme: "BICT", year: 4, gender: "Male" },
  { regNumber: "BICT1524", fullName: "Pemphero Nyirenda", programme: "BICT", year: 4, gender: "Male" },
  { regNumber: "BICT1525", fullName: "Alinafe Kamanga", programme: "BICT", year: 4, gender: "Female" },
  { regNumber: "BICT1526", fullName: "Chimwemwe Zulu", programme: "BICT", year: 4, gender: "Female" },
  { regNumber: "BICT1527", fullName: "Blessings Mwanza", programme: "BICT", year: 4, gender: "Male" },
  { regNumber: "BICT1528", fullName: "Thokozani Msiska", programme: "BICT", year: 4, gender: "Male" },
  { regNumber: "BICT1529", fullName: "Gracious Chikwanda", programme: "BICT", year: 4, gender: "Female" },
  { regNumber: "BICT1530", fullName: "Innocent Nkhoma", programme: "BICT", year: 4, gender: "Male" },
  { regNumber: "BICT1531", fullName: "Lonjezo Chilumba", programme: "BICT", year: 4, gender: "Male" },
  { regNumber: "BICT2501", fullName: "Yankho Manda", programme: "BICT", year: 1, gender: "Male" },
  { regNumber: "BICT2502", fullName: "Salome Phiri", programme: "BICT", year: 1, gender: "Female" },
  { regNumber: "BICT2503", fullName: "Mpho Banda", programme: "BICT", year: 1, gender: "Male" },
  { regNumber: "BICT2504", fullName: "Yolanda Tembo", programme: "BICT", year: 1, gender: "Female" },
  { regNumber: "BICT2505", fullName: "Raphael Gondwe", programme: "BICT", year: 1, gender: "Male" },
  { regNumber: "BICT2506", fullName: "Natasha Mwale", programme: "BICT", year: 1, gender: "Female" },
  { regNumber: "BICT2507", fullName: "Tisunge Chirwa", programme: "BICT", year: 1, gender: "Male" },
  { regNumber: "BICT2508", fullName: "Evelyn Mkandawire", programme: "BICT", year: 1, gender: "Female" },
  { regNumber: "BICT2509", fullName: "Kelvin Nyirenda", programme: "BICT", year: 1, gender: "Male" },
  { regNumber: "BICT2510", fullName: "Patricia Kamanga", programme: "BICT", year: 1, gender: "Female" },
  { regNumber: "BEDICT2501", fullName: "Sandram Zulu", programme: "BEDICT", year: 1, gender: "Male" },
  { regNumber: "BEDICT2502", fullName: "Violet Mwanza", programme: "BEDICT", year: 1, gender: "Female" },
  { regNumber: "BEDICT2503", fullName: "Gerald Msiska", programme: "BEDICT", year: 1, gender: "Male" },
  { regNumber: "BEDICT2504", fullName: "Deborah Chikwanda", programme: "BEDICT", year: 1, gender: "Female" },
  { regNumber: "BEDICT2505", fullName: "Christopher Nkhoma", programme: "BEDICT", year: 1, gender: "Male" },
  { regNumber: "BEDICT2506", fullName: "Fanny Chilumba", programme: "BEDICT", year: 1, gender: "Female" },
  { regNumber: "BEDICT2507", fullName: "Harrison Manda", programme: "BEDICT", year: 1, gender: "Male" },
  { regNumber: "BEDICT2508", fullName: "Gloria Phiri", programme: "BEDICT", year: 1, gender: "Female" },
  { regNumber: "BEDICT2509", fullName: "Emmanuel Banda", programme: "BEDICT", year: 1, gender: "Male" },
  { regNumber: "BEDICT2510", fullName: "Florence Tembo", programme: "BEDICT", year: 1, gender: "Female" },
];

// Year 4 courses from timetable
const year4Courses = [
  "BTRS 1206", "EDUF 1201", "GEOG 1201",
  "FREN 1201", "BTRS 2402", "GEOG 2404",
  "BTRS 2401", "FREN 3601", "EDUF 3603", "ENGL 3601"
];

// Year 1 courses from timetable
const year1Courses = [
  "BTRS 1206", "EDUF 1201", "GEOG 1201",
  "FREN 1201", "BTRS 2402"
];

async function registerStudents() {
  console.log("Registering 40 students to courses...\n");

  let success = 0;
  let enrollCount = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const batch = writeBatch(db);

    // Pick courses based on year
    const assignedCourses = student.year === 4
      ? year4Courses
      : year1Courses;

    // Save student with enrolled courses
    const studentRef = doc(db, "students", student.regNumber);
    batch.set(studentRef, {
      regNumber: student.regNumber,
      fullName: student.fullName,
      programme: student.programme,
      year: student.year,
      gender: student.gender,
      barcode: student.regNumber,
      enrolledCourses: assignedCourses,
      createdAt: new Date().toISOString(),
    });

    // Create enrollment record for each course
    for (const courseCode of assignedCourses) {
      const enrollRef = doc(
        db,
        "enrollments",
        `${student.regNumber}_${courseCode.replace(" ", "_")}`
      );
      batch.set(enrollRef, {
        studentId: student.regNumber,
        studentName: student.fullName,
        regNumber: student.regNumber,
        programme: student.programme,
        year: student.year,
        gender: student.gender,
        courseCode: courseCode,
        enrolledAt: new Date().toISOString(),
      });
      enrollCount++;
    }

    await batch.commit();
    success++;
    console.log(`✅ ${student.regNumber} - ${student.fullName} → ${assignedCourses.length} courses`);
  }

  console.log(`\n✅ Import complete!`);
  console.log(`Students registered: ${success}`);
  console.log(`Enrollment records: ${enrollCount}`);
  process.exit(0);
}

registerStudents();