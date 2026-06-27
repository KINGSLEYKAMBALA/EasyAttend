const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");

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

// ============================================
// COURSES DATA
// ============================================
const courses = [
  { code: "BICT4801", name: "Artificial Intelligence", year: 4, semester: 2 },
  { code: "BICT4802", name: "Electronic Commerce", year: 4, semester: 2 },
  { code: "BICT4803", name: "Business Management", year: 4, semester: 2 },
  { code: "BICT4804", name: "Systems Project", year: 4, semester: 2 },
  { code: "BICT4805", name: "Industrial Attachment", year: 4, semester: 2 },
  { code: "BICT1101", name: "End User Computing", year: 1, semester: 1 },
  { code: "BICT1102", name: "Introduction to Programming", year: 1, semester: 1 },
  { code: "BICT1103", name: "Computer and Communication Technology", year: 1, semester: 1 },
  { code: "COMM1101", name: "Communication Skills I", year: 1, semester: 1 },
  { code: "MATH1101", name: "Precalculus", year: 1, semester: 1 },
];

// ============================================
// STUDENTS DATA - 40 Students
// ============================================
const students = [
  // Year 4 BEDICT
  { regNumber: "BEDICT1522", fullName: "Kingsley Kambala", programme: "BEDICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BEDICT1523", fullName: "Linton Chimkwitha", programme: "BEDICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BEDICT1524", fullName: "Chisomo Banda", programme: "BEDICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BEDICT1525", fullName: "Takondwa Phiri", programme: "BEDICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BEDICT1526", fullName: "Mercy Mwale", programme: "BEDICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BEDICT1527", fullName: "Kondwani Tembo", programme: "BEDICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BEDICT1528", fullName: "Tiwonge Chirwa", programme: "BEDICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BEDICT1529", fullName: "Mphatso Gondwe", programme: "BEDICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BEDICT1530", fullName: "Fyawupi Mbewe", programme: "BEDICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BEDICT1531", fullName: "Wezzie Lungu", programme: "BEDICT", year: 4, gender: "Female", courseCode: "BICT4801" },

  // Year 4 BICT
  { regNumber: "BICT1522", fullName: "Tadala Chavula", programme: "BICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BICT1523", fullName: "Dalitso Mkandawire", programme: "BICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BICT1524", fullName: "Pemphero Nyirenda", programme: "BICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BICT1525", fullName: "Alinafe Kamanga", programme: "BICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BICT1526", fullName: "Chimwemwe Zulu", programme: "BICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BICT1527", fullName: "Blessings Mwanza", programme: "BICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BICT1528", fullName: "Thokozani Msiska", programme: "BICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BICT1529", fullName: "Gracious Chikwanda", programme: "BICT", year: 4, gender: "Female", courseCode: "BICT4801" },
  { regNumber: "BICT1530", fullName: "Innocent Nkhoma", programme: "BICT", year: 4, gender: "Male", courseCode: "BICT4801" },
  { regNumber: "BICT1531", fullName: "Lonjezo Chilumba", programme: "BICT", year: 4, gender: "Male", courseCode: "BICT4801" },

  // Year 1 BICT
  { regNumber: "BICT2501", fullName: "Yankho Manda", programme: "BICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BICT2502", fullName: "Salome Phiri", programme: "BICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BICT2503", fullName: "Mpho Banda", programme: "BICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BICT2504", fullName: "Yolanda Tembo", programme: "BICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BICT2505", fullName: "Raphael Gondwe", programme: "BICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BICT2506", fullName: "Natasha Mwale", programme: "BICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BICT2507", fullName: "Tisunge Chirwa", programme: "BICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BICT2508", fullName: "Evelyn Mkandawire", programme: "BICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BICT2509", fullName: "Kelvin Nyirenda", programme: "BICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BICT2510", fullName: "Patricia Kamanga", programme: "BICT", year: 1, gender: "Female", courseCode: "BICT1101" },

  // Year 1 BEDICT
  { regNumber: "BEDICT2501", fullName: "Sandram Zulu", programme: "BEDICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BEDICT2502", fullName: "Violet Mwanza", programme: "BEDICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BEDICT2503", fullName: "Gerald Msiska", programme: "BEDICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BEDICT2504", fullName: "Deborah Chikwanda", programme: "BEDICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BEDICT2505", fullName: "Christopher Nkhoma", programme: "BEDICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BEDICT2506", fullName: "Fanny Chilumba", programme: "BEDICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BEDICT2507", fullName: "Harrison Manda", programme: "BEDICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BEDICT2508", fullName: "Gloria Phiri", programme: "BEDICT", year: 1, gender: "Female", courseCode: "BICT1101" },
  { regNumber: "BEDICT2509", fullName: "Emmanuel Banda", programme: "BEDICT", year: 1, gender: "Male", courseCode: "BICT1101" },
  { regNumber: "BEDICT2510", fullName: "Florence Tembo", programme: "BEDICT", year: 1, gender: "Female", courseCode: "BICT1101" },
];

// ============================================
// IMPORT FUNCTIONS
// ============================================
async function importAll() {
  console.log("Starting import...\n");

  // Import Courses
  console.log(`Importing ${courses.length} courses...`);
  for (const course of courses) {
    try {
      await setDoc(doc(db, "courses", course.code), {
        courseCode: course.code,
        courseName: course.name,
        year: course.year,
        semester: course.semester,
        createdAt: new Date().toISOString(),
      });
      console.log(`✅ Course: ${course.code} - ${course.name}`);
    } catch (error) {
      console.error(`❌ Failed course ${course.code}:`, error.message);
    }
  }

  console.log("\n");

  // Import Students
  console.log(`Importing ${students.length} students...`);
  let studentSuccess = 0;
  for (const student of students) {
    try {
      await setDoc(doc(db, "students", student.regNumber), {
        regNumber: student.regNumber,
        fullName: student.fullName,
        programme: student.programme,
        year: student.year,
        gender: student.gender,
        courseCode: student.courseCode,
        barcode: student.regNumber,
        createdAt: new Date().toISOString(),
      });
      studentSuccess++;
      if (studentSuccess % 10 === 0) {
        console.log(`✅ Uploaded ${studentSuccess}/${students.length} students...`);
      }
    } catch (error) {
      console.error(`❌ Failed student ${student.regNumber}:`, error.message);
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`Courses: ${courses.length}`);
  console.log(`Students: ${students.length}`);
  process.exit(0);
}

importAll();