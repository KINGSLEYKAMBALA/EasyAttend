// Run once from EasyAttendAPI folder:
//   node createInstructors.js
//
// Creates / verifies Firebase Auth accounts for each instructor and writes
// their Firestore document with the courses they teach.

const https = require("https");
require("dotenv").config();

const FIREBASE_API_KEY = "AIzaSyBXu48Sc17V64gFvakIPHDG9LzEu_9sfF4";
const PROJECT_ID      = "easyattend-b2bc0";
const DEFAULT_PASSWORD = "mzuni@2026";

// All 77 unique course codes from the timetable distributed evenly (~7-8 each).
const instructors = [
  {
    email: "namatcha@mzuni.ac.mw", name: "Namatcha",
    courseCodes: ["BTRS 1206", "BTRS 1202", "BTRS 1205", "BTRS 2401", "BTRS 2402", "BTRS 2406", "BTRS 2407", "BTRS 3601"],
  },
  {
    email: "kambala@mzuni.ac.mw", name: "Kambala",
    courseCodes: ["BTRS 3602", "BTRS 3605", "BTRS 3606", "BTRS 4801", "BTRS 4802", "BTRS 4808", "BTRS 4810", "EDUF 1201"],
  },
  {
    email: "cphiri@mzuni.ac.mw", name: "C. Phiri",
    courseCodes: ["EDUF 1202", "EDUF 2401", "EDUF 2402", "EDUF 3603", "EDUF 3604", "EDUF 4801", "EDUF 4802"],
  },
  {
    email: "tbanda@mzuni.ac.mw", name: "T. Banda",
    courseCodes: ["GEOG 1201", "GEOG 1202", "GEOG 2402", "GEOG 2404", "GEOG 3601", "GEOG 3602", "GEOG 3603", "GEOG 4801"],
  },
  {
    email: "ymvula@mzuni.ac.mw", name: "Y. Mvula",
    courseCodes: ["GEOG 4803", "GEOG 4804", "ENGL 1201", "ENGL 2401", "ENGL 3601", "ENGL 3602", "ENGL 4801", "ENGL 4802"],
  },
  {
    email: "cgondwe@mzuni.ac.mw", name: "C. Gondwe",
    courseCodes: ["FREN 1201", "FREN 2401", "FREN 3601", "FREN 4801", "FREN 4802", "FREN 4803", "FREN 4804"],
  },
  {
    email: "mchirwa@mzuni.ac.mw", name: "M. Chirwa",
    courseCodes: ["BHHS 1201", "BHHS 2401", "BHHS 3601", "BHHS 3602", "BHHS 4801", "BHHS 4802", "BHHS 4804"],
  },
  {
    email: "tmhango@mzuni.ac.mw", name: "T. Mhango",
    courseCodes: ["ALLE 1201", "ALLE 2401", "ALLE 3601", "ALLE 3602", "ALLE 4801", "ALLE 4802", "HISM 2401", "HISM 3601"],
  },
  {
    email: "lnyirenda@mzuni.ac.mw", name: "L. Nyirenda",
    courseCodes: ["HISM 4801", "GEOM 2401", "GEOM 3601", "GEOM 4801", "CHIM 2401", "CHIM 3601", "CHIM 4801", "ENGM 2401"],
  },
  {
    email: "ckachepa@mzuni.ac.mw", name: "C. Kachepa",
    courseCodes: ["ENGM 3601", "ENGM 4801", "FREM 2401", "FREM 3601", "FREM 4801", "ETRM 2401", "ETRM 3601", "LANM 4701"],
  },
];

// ── REST helpers ──────────────────────────────────────────────────────────────

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function createAuthUser(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const res = await post(url, { email, password, returnSecureToken: true });
  if (res.status === 200) return { uid: res.body.localId, created: true };
  const code = res.body?.error?.message || "";
  if (code === "EMAIL_EXISTS") return { uid: null, created: false, exists: true };
  throw new Error(code || JSON.stringify(res.body));
}

async function signIn(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const res = await post(url, { email, password, returnSecureToken: true });
  if (res.status === 200) return { uid: res.body.localId, idToken: res.body.idToken };
  return null;
}

// PATCH Firestore document via REST (no Admin SDK required, uses public API)
async function upsertFirestore(uid, email, name, courseCodes) {
  const arrayValues = courseCodes.map((c) => ({ stringValue: c }));
  const body = {
    fields: {
      uid:         { stringValue: uid },
      name:        { stringValue: name },
      email:       { stringValue: email },
      courseCodes: { arrayValue: { values: arrayValues } },
      updatedAt:   { stringValue: new Date().toISOString() },
    },
  };

  const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/instructors/${uid}`;
  const mask = "updateMask.fieldPaths=uid&updateMask.fieldPaths=name&updateMask.fieldPaths=email&updateMask.fieldPaths=courseCodes&updateMask.fieldPaths=updatedAt";
  const fullUrl = `https://firestore.googleapis.com/v1/${docPath}?${mask}`;
  const u = new URL(fullUrl);
  const data = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => resolve({ status: res.statusCode, body: raw }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nSetting up ${instructors.length} instructor accounts...\n`);

  for (const instructor of instructors) {
    try {
      let uid;

      const result = await createAuthUser(instructor.email, DEFAULT_PASSWORD);

      if (result.created) {
        uid = result.uid;
        console.log(`✅ Created auth: ${instructor.email}`);
      } else if (result.exists) {
        const session = await signIn(instructor.email, DEFAULT_PASSWORD);
        if (session) {
          uid = session.uid;
          console.log(`🔄 Auth OK:      ${instructor.email}`);
        } else {
          console.warn(`⚠️  Wrong password — delete & recreate in Firebase Console: ${instructor.email}`);
          continue;
        }
      }

      if (uid) {
        const fsResult = await upsertFirestore(uid, instructor.email, instructor.name, instructor.courseCodes);
        if (fsResult.status === 200) {
          console.log(`   📄 Firestore doc updated (${instructor.courseCodes.length} courses)`);
        } else {
          console.error(`   ❌ Firestore write failed (${fsResult.status}):`, fsResult.body.substring(0, 200));
        }
      }
    } catch (err) {
      console.error(`❌ Failed for ${instructor.email}:`, err.message);
    }
  }

  console.log("\n✅ Done.\n");
  process.exit(0);
}

run();
