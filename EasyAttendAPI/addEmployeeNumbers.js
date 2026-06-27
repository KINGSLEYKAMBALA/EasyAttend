const { db } = require('./services/firebaseAdmin');

const employeeNumbers = {
  "namatcha@mzuni.ac.mw": "EMP1001",
  "kambala@mzuni.ac.mw": "EMP1002",
  "cphiri@mzuni.ac.mw": "EMP1003",
  "tbanda@mzuni.ac.mw": "EMP1004",
  "ymvula@mzuni.ac.mw": "EMP1005",
  "cgondwe@mzuni.ac.mw": "EMP1006",
  "mchirwa@mzuni.ac.mw": "EMP1007",
  "tmhango@mzuni.ac.mw": "EMP1008",
  "lnyirenda@mzuni.ac.mw": "EMP1009",
  "ckachepa@mzuni.ac.mw": "EMP1010",
};

async function update() {
  for (const [email, employeeNumber] of Object.entries(employeeNumbers)) {
    const snapshot = await db.collection('instructors')
      .where('email', '==', email)
      .limit(1).get();

    if (snapshot.empty) {
      console.log(`❌ Not found: ${email}`);
      continue;
    }

    await db.collection('instructors').doc(snapshot.docs[0].id).update({
      employeeNumber,
    });
    console.log(`✅ ${email} → ${employeeNumber}`);
  }
  console.log("✅ Employee numbers added!");
}

update();