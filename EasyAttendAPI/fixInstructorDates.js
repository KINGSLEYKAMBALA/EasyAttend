const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, updateDoc } = require("firebase/firestore");

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

const FALLBACK_DATE = new Date("2026-01-10").toISOString(); // original import date

async function fix() {
  const snap = await getDocs(collection(db, "instructors"));
  let fixed = 0;

  for (const d_ of snap.docs) {
    const data = d_.data();
    const raw = data.createdAt;
    const isInvalid = !raw || isNaN(new Date(raw?.seconds ? raw.seconds * 1000 : raw).getTime());

    if (isInvalid) {
      await updateDoc(doc(db, "instructors", d_.id), { createdAt: FALLBACK_DATE });
      console.log(`✅ Fixed: ${data.email || data.fullName || d_.id}`);
      fixed++;
    }
  }

  console.log(`\nDone. Fixed ${fixed} records.`);
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
