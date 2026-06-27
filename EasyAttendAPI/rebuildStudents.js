const { db } = require('./services/firebaseAdmin');

const students = [
  { name: "Yankho Kasambala", regNumber: "BTRS1525", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Towera Gondwe", regNumber: "BTRS1528", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Tamanda Phiri", regNumber: "BTRS1530", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Mwayi Chisale", regNumber: "BTRS1533", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Chimwemwe Khonje", regNumber: "BTRS1535", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Lazarus Mvula", regNumber: "BTRS1537", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Chikondi Chipeta", regNumber: "BTRS1539", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Andrew Chirwa", regNumber: "BTRS1543", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Loveness Mhango", regNumber: "BTRS1545", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Bright Gondwe", regNumber: "BTRS1547", courseCode: "BTRS 1206", level: 1, programName: "Bachelor of Arts (Theology and Religious Studies)" },

  { name: "Khumbo Zimba", regNumber: "EDUF1537", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Chimwemwe Chimombo", regNumber: "EDUF1540", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Esnart Mvula", regNumber: "EDUF1541", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Gift Soko", regNumber: "EDUF1542", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Andrew Kasambala", regNumber: "EDUF1545", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Khumbo Chimombo", regNumber: "EDUF1549", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Maria Kanyenda", regNumber: "EDUF1552", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Faith Nyirenda", regNumber: "EDUF1554", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Joseph Chisale", regNumber: "EDUF1557", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },
  { name: "Mwayi Kanyenda", regNumber: "EDUF1561", courseCode: "EDUF 1201", level: 1, programName: "Bachelor of Education (Arts)" },

  { name: "Kondwani Chimombo", regNumber: "GEOG1549", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Chimwemwe Chunga", regNumber: "GEOG1552", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Felix Kaunda", regNumber: "GEOG1553", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Bright Lungu", regNumber: "GEOG1555", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Ireen Munthali", regNumber: "GEOG1556", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Vitumbiko Chisale", regNumber: "GEOG1558", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Eness Chibwana", regNumber: "GEOG1562", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Faith Chibwana", regNumber: "GEOG1564", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Takondwa Chimombo", regNumber: "GEOG1567", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Eness Msusa", regNumber: "GEOG1569", courseCode: "GEOG 1201", level: 1, programName: "Bachelor of Arts (Development Studies)" },

  { name: "Samuel Sangala", regNumber: "FREN1531", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Nelson Soko", regNumber: "FREN1535", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Tamanda Kachepa", regNumber: "FREN1538", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Enock Mtonga", regNumber: "FREN1539", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Memory Sangala", regNumber: "FREN1540", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Tiwonge Kaunda", regNumber: "FREN1544", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Andrew Mvula", regNumber: "FREN1546", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Tamanda Kanyenda", regNumber: "FREN1550", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Blessings Sangala", regNumber: "FREN1552", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },
  { name: "Tapiwa Kaweche", regNumber: "FREN1556", courseCode: "FREN 1201", level: 1, programName: "Bachelor of Education (Languages)" },

  { name: "Samuel Munthali", regNumber: "BTRS1550", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Vitumbiko Chirwa", regNumber: "BTRS1551", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Chikondi Manda", regNumber: "BTRS1555", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Lusungu Chirwa", regNumber: "BTRS1559", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Chimwemwe Kapito", regNumber: "BTRS1563", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Pemphero Mbewe", regNumber: "BTRS1564", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Yamikani Mlozi", regNumber: "BTRS1566", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Edna Kambwiri", regNumber: "BTRS1568", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Fatsani Kaunda", regNumber: "BTRS1570", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Chimwemwe Tembo", regNumber: "BTRS1571", courseCode: "BTRS 2402", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },

  { name: "Mercy Kamanga", regNumber: "GEOG1571", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Ethel Ngwira", regNumber: "GEOG1575", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Towera Kaunda", regNumber: "GEOG1577", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Takondwa Kambwiri", regNumber: "GEOG1581", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Nelson Ngwira", regNumber: "GEOG1584", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Hope Kamanga", regNumber: "GEOG1586", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Chikumbutso Kanyenda", regNumber: "GEOG1588", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Hope Mtonga", regNumber: "GEOG1589", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Edna Kalua", regNumber: "GEOG1590", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },
  { name: "Catherine Kasambala", regNumber: "GEOG1591", courseCode: "GEOG 2404", level: 2, programName: "Bachelor of Arts (Development Studies)" },

  { name: "Takondwa Mwale", regNumber: "BTRS1573", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Tiwonge Zimba", regNumber: "BTRS1577", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Catherine Banda", regNumber: "BTRS1579", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Petros Munthali", regNumber: "BTRS1581", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Faith Chiumia", regNumber: "BTRS1582", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Mercy Banda", regNumber: "BTRS1585", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Innocent Mtonga", regNumber: "BTRS1587", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Steria Chunga", regNumber: "BTRS1590", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Blessings Kamanga", regNumber: "BTRS1592", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },
  { name: "Enock Chunga", regNumber: "BTRS1595", courseCode: "BTRS 2401", level: 2, programName: "Bachelor of Arts (Theology and Religious Studies)" },

  { name: "Limbani Mlozi", regNumber: "FREN1559", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Towera Ngwira", regNumber: "FREN1563", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Madalitso Ngwira", regNumber: "FREN1565", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Dalitso Chiwaya", regNumber: "FREN1566", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Madalitso Gondwe", regNumber: "FREN1569", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Joseph Chirwa", regNumber: "FREN1573", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Felix Nkata", regNumber: "FREN1577", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Patricia Kachepa", regNumber: "FREN1579", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Tionge Kaweche", regNumber: "FREN1581", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Limbani Nyirenda", regNumber: "FREN1582", courseCode: "FREN 3601", level: 3, programName: "Bachelor of Education (Languages)" },

  { name: "Chisomo Chimombo", regNumber: "EDUF1565", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Tiwonge Phiri", regNumber: "EDUF1567", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Chiyembekezo Chirwa", regNumber: "EDUF1568", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Felix Chunga", regNumber: "EDUF1570", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Ulemu Kasambala", regNumber: "EDUF1572", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Agnes Mbewe", regNumber: "EDUF1574", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Annie Chiwaya", regNumber: "EDUF1578", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Khumbo Kachepa", regNumber: "EDUF1579", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Petros Mlozi", regNumber: "EDUF1580", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },
  { name: "Promise Chiwaya", regNumber: "EDUF1583", courseCode: "EDUF 3603", level: 3, programName: "Bachelor of Education (Arts)" },

  { name: "Maria Mhango", regNumber: "ENGL1547", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Innocent Nyirenda", regNumber: "ENGL1548", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Tionge Chiumia", regNumber: "ENGL1549", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Promise Kambwiri", regNumber: "ENGL1551", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Daniel Phiri", regNumber: "ENGL1553", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Felix Msusa", regNumber: "ENGL1556", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Annie Kasambala", regNumber: "ENGL1557", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Chiyembekezo Msusa", regNumber: "ENGL1558", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Eness Mhango", regNumber: "ENGL1562", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
  { name: "Beatrice Msusa", regNumber: "ENGL1563", courseCode: "ENGL 3601", level: 3, programName: "Bachelor of Education (Languages)" },
];

async function seed() {
  const existingSnapshot = await db.collection('students').get();
  console.log(`Found ${existingSnapshot.size} existing students. Removing old records...`);

  const batchSize = 400;
  const docs = existingSnapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  console.log("✅ Old student records cleared.");

  let added = 0;
  for (const student of students) {
    await db.collection('students').add({
      ...student,
      createdAt: new Date().toISOString(),
    });
    added++;
  }

  console.log(`✅ Added ${added} students (10 per course across 10 courses).`);
}

seed();