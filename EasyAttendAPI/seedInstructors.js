const { db } = require('./services/firebaseAdmin');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Client-side Firebase config (needed to create Auth accounts the same way the dashboard does)
const firebaseConfig = {
  apiKey: "AIzaSyBXu48Sc17V64gFvakIPHDG9LzEu_9sfF4",
  authDomain: "easyattend-b2bc0.firebaseapp.com",
  projectId: "easyattend-b2bc0",
  storageBucket: "easyattend-b2bc0.firebasestorage.app",
  messagingSenderId: "164166265539",
  appId: "1:164166265539:web:0abaafb782afc5044dd076",
};

const clientApp = initializeApp(firebaseConfig, "seedApp");
const auth = getAuth(clientApp);

const instructors = [
  { name: "Mr Ezekiel Namatcha", email: "namatcha@mzuni.ac.mw", courseCode: "BICT4801" },
  { name: "Mr Kingsley Kambala", email: "kambala@mzuni.ac.mw", courseCode: "BICT4802" },
  { name: "Mr Chisomo Phiri", email: "cphiri@mzuni.ac.mw", courseCode: "BICT2201" },
  { name: "Mrs Thandiwe Banda", email: "tbanda@mzuni.ac.mw", courseCode: "BICT2202" },
  { name: "Mr Yamikani Mvula", email: "ymvula@mzuni.ac.mw", courseCode: "BICT3301" },
  { name: "Mrs Chiyembekezo Gondwe", email: "cgondwe@mzuni.ac.mw", courseCode: "BICT3302" },
  { name: "Mr Mphatso Chirwa", email: "mchirwa@mzuni.ac.mw", courseCode: "BICT3303" },
  { name: "Mrs Tadala Mhango", email: "tmhango@mzuni.ac.mw", courseCode: "BICT4803" },
  { name: "Mr Limbani Nyirenda", email: "lnyirenda@mzuni.ac.mw", courseCode: "BICT4804" },
  { name: "Mrs Chimwemwe Kachepa", email: "ckachepa@mzuni.ac.mw", courseCode: "BICT4805" },
];

const DEFAULT_PASSWORD = "Instructor@123";

async function seed() {
  // Fetch real courses so we can match courseName correctly
  const coursesSnapshot = await db.collection('courses').get();
  const courses = coursesSnapshot.docs.map((d) => d.data());

  for (const inst of instructors) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inst.email,
        DEFAULT_PASSWORD
      );

      const matchedCourse = courses.find((c) => c.courseCode === inst.courseCode);

      await db.collection('instructors').add({
        uid: userCredential.user.uid,
        name: inst.name,
        email: inst.email,
        courseCode: inst.courseCode,
        courseName: matchedCourse?.courseName || "Unknown",
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Added: ${inst.name} (${inst.email})`);
    } catch (error) {
      console.error(`❌ Failed for ${inst.name}: ${error.message}`);
    }
  }

  console.log("✅ Instructor seeding complete!");
}

seed();