const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
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
const auth = getAuth(app);
const db = getFirestore(app);

// Default password for all instructors
const DEFAULT_PASSWORD = "mzuni2026";

const instructors = [
  {
    email: "namatcha@mzuni.ac.mw",
    fullName: "Mr Ezekiel Namatcha",
    courseCode: "BTRS 1206",
    courseName: "Introduction to Theology",
    department: "ICT",
  },
  {
    email: "kambala@mzuni.ac.mw",
    fullName: "Mr Kambala",
    courseCode: "EDUF 1201",
    courseName: "Foundations of Education",
    department: "ICT",
  },
  {
    email: "cphiri@mzuni.ac.mw",
    fullName: "Mr C Phiri",
    courseCode: "GEOG 1201",
    courseName: "Introduction to Geography",
    department: "ICT",
  },
  {
    email: "tbanda@mzuni.ac.mw",
    fullName: "Mr T Banda",
    courseCode: "FREN 1201",
    courseName: "French Language I",
    department: "ICT",
  },
  {
    email: "ymvula@mzuni.ac.mw",
    fullName: "Mr Y Mvula",
    courseCode: "BTRS 2402",
    courseName: "Comparative Religious Studies",
    department: "ICT",
  },
  {
    email: "cgondwe@mzuni.ac.mw",
    fullName: "Mr C Gondwe",
    courseCode: "GEOG 2404",
    courseName: "Physical Geography",
    department: "ICT",
  },
  {
    email: "mchirwa@mzuni.ac.mw",
    fullName: "Mr M Chirwa",
    courseCode: "BTRS 2401",
    courseName: "Biblical Studies II",
    department: "ICT",
  },
  {
    email: "tmhango@mzuni.ac.mw",
    fullName: "Mr T Mhango",
    courseCode: "FREN 3601",
    courseName: "French Language III",
    department: "ICT",
  },
  {
    email: "lnyirenda@mzuni.ac.mw",
    fullName: "Mr L Nyirenda",
    courseCode: "EDUF 3603",
    courseName: "Educational Psychology",
    department: "ICT",
  },
  {
    email: "ckachepa@mzuni.ac.mw",
    fullName: "Mr C Kachepa",
    courseCode: "ENGL 3601",
    courseName: "English Literature",
    department: "ICT",
  },
];

async function importInstructors() {
  console.log(`Importing ${instructors.length} instructors...`);
  console.log(`Default password: ${DEFAULT_PASSWORD}\n`);

  let success = 0;
  let failed = 0;

  for (const instructor of instructors) {
    try {
      // Create auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        instructor.email,
        DEFAULT_PASSWORD
      );

      const uid = userCredential.user.uid;

      // Save to Firestore instructors collection
      await setDoc(doc(db, "instructors", uid), {
        uid,
        email: instructor.email,
        fullName: instructor.fullName,
        courseCode: instructor.courseCode,
        courseName: instructor.courseName,
        department: instructor.department,
        defaultPassword: DEFAULT_PASSWORD,
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        role: "instructor",
      });

      console.log(`✅ Created: ${instructor.email} → ${instructor.courseCode}`);
      success++;

    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log(`⚠️ Already exists: ${instructor.email} — skipping`);
      } else {
        console.log(`❌ Failed: ${instructor.email} — ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`Successfully created: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nAll instructors can login with password: ${DEFAULT_PASSWORD}`);
  process.exit(0);
}

importInstructors();