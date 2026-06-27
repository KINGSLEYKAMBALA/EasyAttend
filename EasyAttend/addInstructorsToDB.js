const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

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

const instructors = [
  {
    email: "namatcha@mzuni.ac.mw",
    fullName: "Mr Ezekiel Namatcha",
    courseCode: "BTRS 1206",
    courseName: "Introduction to Theology",
  },
  {
    email: "kambala@mzuni.ac.mw",
    fullName: "Mr Kambala",
    courseCode: "EDUF 1201",
    courseName: "Foundations of Education",
  },
  {
    email: "cphiri@mzuni.ac.mw",
    fullName: "Mr C Phiri",
    courseCode: "GEOG 1201",
    courseName: "Introduction to Geography",
  },
  {
    email: "tbanda@mzuni.ac.mw",
    fullName: "Mr T Banda",
    courseCode: "FREN 1201",
    courseName: "French Language I",
  },
  {
    email: "ymvula@mzuni.ac.mw",
    fullName: "Mr Y Mvula",
    courseCode: "BTRS 2402",
    courseName: "Comparative Religious Studies",
  },
  {
    email: "cgondwe@mzuni.ac.mw",
    fullName: "Mr C Gondwe",
    courseCode: "GEOG 2404",
    courseName: "Physical Geography",
  },
  {
    email: "mchirwa@mzuni.ac.mw",
    fullName: "Mr M Chirwa",
    courseCode: "BTRS 2401",
    courseName: "Biblical Studies II",
  },
  {
    email: "tmhango@mzuni.ac.mw",
    fullName: "Mr T Mhango",
    courseCode: "FREN 3601",
    courseName: "French Language III",
  },
  {
    email: "lnyirenda@mzuni.ac.mw",
    fullName: "Mr L Nyirenda",
    courseCode: "EDUF 3603",
    courseName: "Educational Psychology",
  },
  {
    email: "ckachepa@mzuni.ac.mw",
    fullName: "Mr C Kachepa",
    courseCode: "ENGL 3601",
    courseName: "English Literature",
  },
];

async function addInstructors() {
  console.log(`Adding ${instructors.length} instructors to Firestore...\n`);

  let success = 0;

  for (const instructor of instructors) {
    try {
      // Use email as document ID
      await setDoc(
        doc(db, "instructors", instructor.email),
        {
          email: instructor.email,
          fullName: instructor.fullName,
          courseCode: instructor.courseCode,
          courseName: instructor.courseName,
          department: "ICT",
          role: "instructor",
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        }
      );
      console.log(`✅ Added: ${instructor.email} → ${instructor.courseCode}`);
      success++;
    } catch (error) {
      console.log(`❌ Failed: ${instructor.email} — ${error.message}`);
    }
  }

  console.log(`\n✅ Done! Added ${success} instructors to Firestore.`);
  process.exit(0);
}

addInstructors();