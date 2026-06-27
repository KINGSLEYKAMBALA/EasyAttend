const { db } = require('./services/firebaseAdmin');

const updates = [
  { email: "namatcha@mzuni.ac.mw", courseCode: "BTRS 1206", courseName: "Introduction to Theology" },
  { email: "kambala@mzuni.ac.mw", courseCode: "EDUF 1201", courseName: "Foundations of Education" },
  { email: "cphiri@mzuni.ac.mw", courseCode: "GEOG 1201", courseName: "Introduction to Geography" },
  { email: "tbanda@mzuni.ac.mw", courseCode: "FREN 1201", courseName: "French Language I" },
  { email: "ymvula@mzuni.ac.mw", courseCode: "BTRS 2402", courseName: "Comparative Religious Studies" },
  { email: "cgondwe@mzuni.ac.mw", courseCode: "GEOG 2404", courseName: "Physical Geography" },
  { email: "mchirwa@mzuni.ac.mw", courseCode: "BTRS 2401", courseName: "Biblical Studies II" },
  { email: "tmhango@mzuni.ac.mw", courseCode: "FREN 3601", courseName: "French Language III" },
  { email: "lnyirenda@mzuni.ac.mw", courseCode: "EDUF 3603", courseName: "Educational Psychology" },
  { email: "ckachepa@mzuni.ac.mw", courseCode: "ENGL 3601", courseName: "English Literature" },
];

async function update() {
  for (const u of updates) {
    const snapshot = await db.collection('instructors')
      .where('email', '==', u.email)
      .limit(1).get();

    if (snapshot.empty) {
      console.log(`❌ Not found: ${u.email}`);
      continue;
    }

    const docId = snapshot.docs[0].id;
    await db.collection('instructors').doc(docId).update({
      courseCode: u.courseCode,
      courseName: u.courseName,
    });
    console.log(`✅ Updated: ${u.email} → ${u.courseCode} (${u.courseName})`);
  }
  console.log("✅ Instructor courses updated!");
}

update();