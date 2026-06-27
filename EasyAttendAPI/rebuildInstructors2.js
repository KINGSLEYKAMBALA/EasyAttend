const { db } = require('./services/firebaseAdmin');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, getUserByEmail } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBXu48Sc17V64gFvakIPHDG9LzEu_9sfF4",
  authDomain: "easyattend-b2bc0.firebaseapp.com",
  projectId: "easyattend-b2bc0",
  storageBucket: "easyattend-b2bc0.firebasestorage.app",
  messagingSenderId: "164166265539",
  appId: "1:164166265539:web:0abaafb782afc5044dd076",
};

const clientApp = initializeApp(firebaseConfig, "rebuildApp");
const auth = getAuth(clientApp);

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

const instructors = [
  { name: "Mr Ezekiel Namatcha", email: "namatcha@mzuni.ac.mw", employeeNumber: "EMP1001", courseCode: "BTRS 1206" },
  { name: "Mr Kingsley Kambala", email: "kambala@mzuni.ac.mw", employeeNumber: "EMP1002", courseCode: "EDUF 1201" },
  { name: "Mr Chisomo Phiri", email: "cphiri@mzuni.ac.mw", employeeNumber: "EMP1003", courseCode: "GEOG 1201" },
  { name: "Mrs Thandiwe Banda", email: "tbanda@mzuni.ac.mw", employeeNumber: "EMP1004", courseCode: "FREN 1201" },
  { name: "Mr Yamikani Mvula", email: "ymvula@mzuni.ac.mw", employeeNumber: "EMP1005", courseCode: "BTRS 2402" },
  { name: "Mrs Chiyembekezo Gondwe", email: "cgondwe@mzuni.ac.mw", employeeNumber: "EMP1006", courseCode: "GEOG 2404" },
  { name: "Mr Mphatso Chirwa", email: "mchirwa@mzuni.ac.mw", employeeNumber: "EMP1007", courseCode: "BTRS 2401" },
  { name: "Mrs Tadala Mhango", email: "tmhango@mzuni.ac.mw", employeeNumber: "EMP1008", courseCode: "FREN 3601" },
  { name: "Mr Limbani Nyirenda", email: "lnyirenda@mzuni.ac.mw", employeeNumber: "EMP1009", courseCode: "EDUF 3603" },
  { name: "Mrs Chimwemwe Kachepa", email: "ckachepa@mzuni.ac.mw", employeeNumber: "EMP1010", courseCode: "ENGL 3601" },
];

const DEFAULT_PASSWORD = "Instructor@123";

async function seed() {
  await clearCollection('instructors');

  const coursesSnapshot = await db.collection('courses').get();
  const courses = coursesSnapshot.docs.map((d) => d.data());

  for (const inst of instructors) {
    let uid;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, inst.email, DEFAULT_PASSWORD);
      uid = userCredential.user.uid;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  Auth account already exists for ${inst.email}, reusing.`);
        uid = "existing-" + inst.email;
      } else {
        console.error(`❌ Auth error for ${inst.email}: ${err.message}`);
        continue;
      }
    }

    const matchedCourse = courses.find((c) => c.courseCode === inst.courseCode);

    await db.collection('instructors').add({
      uid,
      name: inst.name,
      email: inst.email,
      employeeNumber: inst.employeeNumber,
      courseCode: inst.courseCode,
      courseName: matchedCourse?.courseName || "Unknown",
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ ${inst.name} (${inst.employeeNumber}) → ${inst.courseCode}`);
  }
  console.log("✅ Instructors rebuilt!");
}

seed();