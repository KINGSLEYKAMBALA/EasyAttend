// ============================================
// EasyAttend - Timetable Firebase Import Script
// Run this ONCE in your EasyAttend project folder
// Command: node importTimetable.js
// ============================================

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
// TIMETABLE DATA FROM YOUR EXCEL FILE
// ============================================
const timetableData = [
  { id: "timetable_001", dayOfWeek: "Monday", programme: "BEDA12", courseCode: "BTRS 1206", startTime: "07:45 AM", endTime: "09:45 AM", venue: "H11", duration: "2 hours" },
  { id: "timetable_002", dayOfWeek: "Monday", programme: "BEDA12", courseCode: "EDUF 1201", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ODLA", duration: "2 hours" },
  { id: "timetable_003", dayOfWeek: "Monday", programme: "BEDA12", courseCode: "GEOG 1201", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_004", dayOfWeek: "Monday", programme: "BEDL12", courseCode: "EDUF 1201", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ODLA", duration: "2 hours" },
  { id: "timetable_005", dayOfWeek: "Monday", programme: "BEDL12", courseCode: "GEOG 1201", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_006", dayOfWeek: "Monday", programme: "BEDF12", courseCode: "EDUF 1201", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ODLA", duration: "2 hours" },
  { id: "timetable_007", dayOfWeek: "Monday", programme: "BEDF12", courseCode: "FREN 1201", startTime: "12:45 PM", endTime: "02:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_008", dayOfWeek: "Monday", programme: "BEDF12", courseCode: "GEOG 1201", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_009", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2402", startTime: "07:45 AM", endTime: "09:45 AM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_010", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF24", courseCode: "GEOG 2404", startTime: "11:45 AM", endTime: "01:45 PM", venue: "ODLA", duration: "2 hours" },
  { id: "timetable_011", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2401", startTime: "02:45 PM", endTime: "04:45 PM", venue: "R", duration: "2 hours" },
  { id: "timetable_012", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2406", startTime: "05:45 PM", endTime: "06:45 PM", venue: "S", duration: "1 hour" },
  { id: "timetable_013", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF24", courseCode: "FREN 2401", startTime: "04:45 PM", endTime: "06:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_014", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "FREN 3601", startTime: "07:45 AM", endTime: "09:45 AM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_015", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "GEOG 3601", startTime: "09:45 AM", endTime: "11:45 AM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_016", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "EDUF 3603", startTime: "11:45 AM", endTime: "01:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_017", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "BHHS 3601", startTime: "01:45 PM", endTime: "03:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_018", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "BTRS 3602", startTime: "03:45 PM", endTime: "04:45 PM", venue: "Q", duration: "1 hour" },
  { id: "timetable_019", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "ENGL 3601", startTime: "04:45 PM", endTime: "06:45 PM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_020", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "BTRS 3601", startTime: "07:45 AM", endTime: "09:45 AM", venue: "T", duration: "2 hours" },
  { id: "timetable_021", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF36", courseCode: "GEOG 3602", startTime: "09:45 AM", endTime: "11:45 AM", venue: "GIS LAB", duration: "2 hours" },
  { id: "timetable_022", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF48", courseCode: "HISM 4801", startTime: "07:45 AM", endTime: "09:45 AM", venue: "S", duration: "2 hours" },
  { id: "timetable_023", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF48", courseCode: "BHHS 4801", startTime: "09:45 AM", endTime: "11:45 AM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_024", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF48", courseCode: "GEOG 4804", startTime: "11:45 AM", endTime: "01:45 PM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_025", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF48", courseCode: "ENGL 4802", startTime: "01:45 PM", endTime: "03:45 PM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_026", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF48", courseCode: "BHHS 4802", startTime: "03:45 PM", endTime: "04:45 PM", venue: "ENG LR", duration: "1 hour" },
  { id: "timetable_027", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4808", startTime: "04:45 PM", endTime: "06:45 PM", venue: "R", duration: "2 hours" },
  { id: "timetable_028", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF1 (ODEL)", courseCode: "FREN 1201", startTime: "07:45 AM", endTime: "09:45 AM", venue: "ODEL COMPUTER LAB", duration: "2 hours" },
  { id: "timetable_029", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF1 (ODEL)", courseCode: "BTRS 1206", startTime: "11:45 AM", endTime: "01:45 PM", venue: "ODLC", duration: "2 hours" },
  { id: "timetable_030", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF1 (ODEL)", courseCode: "GEOG 1201", startTime: "05:45 PM", endTime: "06:45 PM", venue: "ODLB", duration: "1 hour" },
  { id: "timetable_031", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF1 (ODEL)", courseCode: "BTRS 1205", startTime: "07:45 AM", endTime: "09:45 AM", venue: "ODLF", duration: "2 hours" },
  { id: "timetable_032", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF1 (ODEL)", courseCode: "BTRS 2401", startTime: "11:45 AM", endTime: "01:45 PM", venue: "ODLF", duration: "2 hours" },
  { id: "timetable_033", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF2(ODEL)", courseCode: "HISM 2401", startTime: "07:45 AM", endTime: "09:45 AM", venue: "ODLD", duration: "2 hours" },
  { id: "timetable_034", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF2(ODEL)", courseCode: "ENGM 2401", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ODLD", duration: "2 hours" },
  { id: "timetable_035", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF2(ODEL)", courseCode: "CHIM 2401", startTime: "02:45 PM", endTime: "04:45 PM", venue: "ODLF", duration: "2 hours" },
  { id: "timetable_036", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF2(ODEL)", courseCode: "BTRS 2407", startTime: "04:45 PM", endTime: "06:45 PM", venue: "ODLF", duration: "2 hours" },
  { id: "timetable_037", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF3(ODEL)", courseCode: "BTRS 3602", startTime: "07:45 AM", endTime: "09:45 AM", venue: "ODLD", duration: "2 hours" },
  { id: "timetable_038", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF3(ODEL)", courseCode: "GEOM 3601", startTime: "03:45 PM", endTime: "04:45 PM", venue: "ODLE", duration: "1 hour" },
  { id: "timetable_039", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF3(ODEL)", courseCode: "CHIM 3601", startTime: "11:45 AM", endTime: "01:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_040", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF3(ODEL)", courseCode: "ENGM 3601", startTime: "01:45 PM", endTime: "03:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_041", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF3(ODEL)", courseCode: "ENGL 3601", startTime: "03:45 PM", endTime: "04:45 PM", venue: "ODLC", duration: "1 hour" },
  { id: "timetable_042", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF3(ODEL)", courseCode: "FREN 3603", startTime: "04:45 PM", endTime: "06:45 PM", venue: "ODLE", duration: "2 hours" },
  { id: "timetable_043", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF4(ODEL)", courseCode: "LANM 4701", startTime: "07:45 AM", endTime: "09:45 AM", venue: "ODLA", duration: "2 hours" },
  { id: "timetable_044", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF4(ODEL)", courseCode: "BTRS 4801", startTime: "11:45 AM", endTime: "01:45 PM", venue: "ODLF", duration: "2 hours" },
  { id: "timetable_045", dayOfWeek: "Monday", programme: "BEDA/BEDL/BEDF4(ODEL)", courseCode: "HISM 4801", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  // TUESDAY
  { id: "timetable_046", dayOfWeek: "Tuesday", programme: "BEDA12", courseCode: "BTRS 1206", startTime: "08:45 AM", endTime: "09:45 AM", venue: "H11", duration: "1 hour" },
  { id: "timetable_047", dayOfWeek: "Tuesday", programme: "BEDA12", courseCode: "GEOG 1202", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_048", dayOfWeek: "Tuesday", programme: "BEDA12", courseCode: "ENGL 1201", startTime: "02:45 PM", endTime: "03:45 PM", venue: "ODLB", duration: "1 hour" },
  { id: "timetable_049", dayOfWeek: "Tuesday", programme: "BEDA12", courseCode: "BTRS 1202", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_050", dayOfWeek: "Tuesday", programme: "BEDL12", courseCode: "GEOG 1202", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_051", dayOfWeek: "Tuesday", programme: "BEDL12", courseCode: "ENGL 1201", startTime: "02:45 PM", endTime: "03:45 PM", venue: "ODLB", duration: "1 hour" },
  { id: "timetable_052", dayOfWeek: "Tuesday", programme: "BEDL12", courseCode: "BTRS 1202", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_053", dayOfWeek: "Tuesday", programme: "BEDF12", courseCode: "GEOG 1202", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_054", dayOfWeek: "Tuesday", programme: "BEDF12", courseCode: "FREN 1201", startTime: "11:45 AM", endTime: "01:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_055", dayOfWeek: "Tuesday", programme: "BEDF12", courseCode: "ENGL 1201", startTime: "02:45 PM", endTime: "03:45 PM", venue: "ODLB", duration: "1 hour" },
  { id: "timetable_056", dayOfWeek: "Tuesday", programme: "BEDF12", courseCode: "BTRS 1202", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_057", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF24", courseCode: "EDUF 2401", startTime: "07:45 AM", endTime: "09:45 AM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_058", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF24", courseCode: "BHHS 2401", startTime: "09:45 AM", endTime: "11:45 AM", venue: "ODLA", duration: "2 hours" },
  { id: "timetable_059", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF24", courseCode: "ENGM 2401", startTime: "12:45 PM", endTime: "02:45 PM", venue: "ODLC", duration: "2 hours" },
  { id: "timetable_060", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2401", startTime: "02:45 PM", endTime: "03:45 PM", venue: "ODLC", duration: "1 hour" },
  { id: "timetable_061", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF24", courseCode: "GEOM 2401", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLC", duration: "2 hours" },
  { id: "timetable_062", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF24", courseCode: "GEOG 2404", startTime: "05:45 PM", endTime: "06:45 PM", venue: "ODLB", duration: "1 hour" },
  { id: "timetable_063", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF36", courseCode: "GEOM 3601", startTime: "07:45 AM", endTime: "09:45 AM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_064", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF36", courseCode: "ENGM 3601", startTime: "09:45 AM", endTime: "11:45 AM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_065", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF36", courseCode: "BTRS 3601", startTime: "01:45 PM", endTime: "02:45 PM", venue: "T", duration: "1 hour" },
  { id: "timetable_066", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF36", courseCode: "BHHS 3601", startTime: "02:45 PM", endTime: "03:45 PM", venue: "ENG LR", duration: "1 hour" },
  { id: "timetable_067", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF36", courseCode: "ENGL 3602", startTime: "03:45 PM", endTime: "04:45 PM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_068", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF36", courseCode: "ALLE 3602", startTime: "04:45 PM", endTime: "06:45 PM", venue: "S", duration: "2 hours" },
  { id: "timetable_069", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF36", courseCode: "FREN 3601", startTime: "04:45 PM", endTime: "06:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_070", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "FREM 4801", startTime: "07:45 AM", endTime: "09:45 AM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_071", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "FREN 4801", startTime: "09:45 AM", endTime: "11:45 AM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_072", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "ENGL 4801", startTime: "11:45 AM", endTime: "12:45 PM", venue: "GEOG LR", duration: "1 hour" },
  { id: "timetable_073", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "BHHS 4804", startTime: "12:45 PM", endTime: "01:45 PM", venue: "GEOG LR", duration: "1 hour" },
  { id: "timetable_074", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "EDUF 4802", startTime: "01:45 PM", endTime: "03:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_075", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "BHHS 4802", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_076", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "ENGM 4801", startTime: "05:45 PM", endTime: "06:45 PM", venue: "GEOG LR", duration: "1 hour" },
  { id: "timetable_077", dayOfWeek: "Tuesday", programme: "BEDA/BEDL/BEDF48", courseCode: "ETRM 4801", startTime: "09:45 AM", endTime: "11:45 AM", venue: "R", duration: "2 hours" },
  // WEDNESDAY
  { id: "timetable_078", dayOfWeek: "Wednesday", programme: "BEDA12", courseCode: "GEOG 1201", startTime: "07:45 AM", endTime: "08:45 AM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_079", dayOfWeek: "Wednesday", programme: "BEDA12", courseCode: "BTRS 1202", startTime: "12:45 PM", endTime: "02:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_080", dayOfWeek: "Wednesday", programme: "BEDA12", courseCode: "EDUF 1202", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_081", dayOfWeek: "Wednesday", programme: "BEDA12", courseCode: "ALLE 1201", startTime: "05:45 PM", endTime: "06:45 PM", venue: "ODLB", duration: "1 hour" },
  { id: "timetable_082", dayOfWeek: "Wednesday", programme: "BEDL12", courseCode: "GEOG 1201", startTime: "07:45 AM", endTime: "08:45 AM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_083", dayOfWeek: "Wednesday", programme: "BEDL12", courseCode: "BTRS 1202", startTime: "12:45 PM", endTime: "02:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_084", dayOfWeek: "Wednesday", programme: "BEDL12", courseCode: "EDUF 1202", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_085", dayOfWeek: "Wednesday", programme: "BEDF12", courseCode: "GEOG 1201", startTime: "07:45 AM", endTime: "08:45 AM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_086", dayOfWeek: "Wednesday", programme: "BEDF12", courseCode: "BTRS 1202", startTime: "12:45 PM", endTime: "02:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_087", dayOfWeek: "Wednesday", programme: "BEDF12", courseCode: "EDUF 1202", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_088", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF24", courseCode: "BHHS 2401", startTime: "08:45 AM", endTime: "09:45 AM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_089", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2407", startTime: "11:45 AM", endTime: "01:45 PM", venue: "H11", duration: "2 hours" },
  { id: "timetable_090", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF24", courseCode: "FREM 2401", startTime: "01:45 PM", endTime: "03:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_091", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF24", courseCode: "ETRM 2401", startTime: "03:45 PM", endTime: "05:45 PM", venue: "T", duration: "2 hours" },
  { id: "timetable_092", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2406", startTime: "05:45 PM", endTime: "06:45 PM", venue: "T", duration: "1 hour" },
  { id: "timetable_093", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF24", courseCode: "FREN 2401", startTime: "04:45 PM", endTime: "06:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_094", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "FREM 3601", startTime: "07:45 AM", endTime: "09:45 AM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_095", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "GEOG 3601", startTime: "09:45 AM", endTime: "11:45 AM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_096", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "EDUF 3604", startTime: "11:45 AM", endTime: "01:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_097", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "BHHS 3602", startTime: "01:45 PM", endTime: "03:45 PM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_098", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "ALLE 3601", startTime: "03:45 PM", endTime: "05:45 PM", venue: "GEOG LR", duration: "2 hours" },
  { id: "timetable_099", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "ALLE 3602", startTime: "05:45 PM", endTime: "06:45 PM", venue: "ENG LR", duration: "1 hour" },
  { id: "timetable_100", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "ETRM 3601", startTime: "07:45 AM", endTime: "09:45 AM", venue: "R", duration: "2 hours" },
  { id: "timetable_101", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "GEOG 3602", startTime: "09:45 AM", endTime: "11:45 AM", venue: "GIS LAB", duration: "2 hours" },
  { id: "timetable_102", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF36", courseCode: "BTRS 3606", startTime: "04:45 PM", endTime: "06:45 PM", venue: "S", duration: "2 hours" },
  { id: "timetable_103", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF48", courseCode: "GEOG 4804", startTime: "07:45 AM", endTime: "09:45 AM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_104", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF48", courseCode: "BHHS 4801", startTime: "09:45 AM", endTime: "11:45 AM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_105", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF48", courseCode: "BHHS 4804", startTime: "11:45 AM", endTime: "01:45 PM", venue: "MLR", duration: "2 hours" },
  { id: "timetable_106", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF48", courseCode: "ENGL 4801", startTime: "01:45 PM", endTime: "03:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_107", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4810", startTime: "03:45 PM", endTime: "04:45 PM", venue: "MLR", duration: "1 hour" },
  { id: "timetable_108", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF48", courseCode: "ALLE 4801", startTime: "04:45 PM", endTime: "06:45 PM", venue: "MLR", duration: "2 hours" },
  { id: "timetable_109", dayOfWeek: "Wednesday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4802", startTime: "04:45 PM", endTime: "06:45 PM", venue: "H11", duration: "2 hours" },
  // THURSDAY
  { id: "timetable_110", dayOfWeek: "Thursday", programme: "BEDA12", courseCode: "BTRS 1205", startTime: "07:45 AM", endTime: "08:45 AM", venue: "H11", duration: "1 hour" },
  { id: "timetable_111", dayOfWeek: "Thursday", programme: "BEDA12", courseCode: "BHHS 1201", startTime: "11:45 AM", endTime: "12:45 PM", venue: "ENG LR", duration: "1 hour" },
  { id: "timetable_112", dayOfWeek: "Thursday", programme: "BEDA12", courseCode: "ENGL 1201", startTime: "02:45 PM", endTime: "04:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_113", dayOfWeek: "Thursday", programme: "BEDA12", courseCode: "GEOG 1202", startTime: "05:45 PM", endTime: "06:45 PM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_114", dayOfWeek: "Thursday", programme: "BEDL12", courseCode: "ENGL 1201", startTime: "02:45 PM", endTime: "04:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_115", dayOfWeek: "Thursday", programme: "BEDL12", courseCode: "GEOG 1202", startTime: "05:45 PM", endTime: "06:45 PM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_116", dayOfWeek: "Thursday", programme: "BEDF12", courseCode: "ENGL 1201", startTime: "02:45 PM", endTime: "04:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_117", dayOfWeek: "Thursday", programme: "BEDF12", courseCode: "GEOG 1202", startTime: "05:45 PM", endTime: "06:45 PM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_118", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF24", courseCode: "EDUF 2402", startTime: "07:45 AM", endTime: "09:45 AM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_119", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2407", startTime: "11:45 AM", endTime: "12:45 PM", venue: "H11", duration: "1 hour" },
  { id: "timetable_120", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF24", courseCode: "GEOG 2402", startTime: "12:45 PM", endTime: "01:45 PM", venue: "ENG LR", duration: "1 hour" },
  { id: "timetable_121", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF24", courseCode: "ENGL 2401", startTime: "01:45 PM", endTime: "03:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_122", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF24", courseCode: "ALLE 2401", startTime: "04:45 PM", endTime: "06:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_123", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF36", courseCode: "BTRS 3605", startTime: "07:45 AM", endTime: "09:45 AM", venue: "H11", duration: "2 hours" },
  { id: "timetable_124", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF36", courseCode: "ALLE 3601", startTime: "09:45 AM", endTime: "11:45 AM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_125", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF36", courseCode: "GEOG 3603", startTime: "01:45 PM", endTime: "03:45 PM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_126", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF36", courseCode: "BHHS 3602", startTime: "03:45 PM", endTime: "04:45 PM", venue: "ENG LR", duration: "1 hour" },
  { id: "timetable_127", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF36", courseCode: "BTRS 3602", startTime: "09:45 AM", endTime: "11:45 AM", venue: "T", duration: "2 hours" },
  { id: "timetable_128", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "FREN 4802", startTime: "07:45 AM", endTime: "09:45 AM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_129", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "GEOG 4801", startTime: "09:45 AM", endTime: "11:45 AM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_130", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "EDUF 4801", startTime: "11:45 AM", endTime: "01:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_131", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4801", startTime: "01:45 PM", endTime: "02:45 PM", venue: "H11", duration: "1 hour" },
  { id: "timetable_132", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "ENGL 4802", startTime: "02:45 PM", endTime: "04:45 PM", venue: "GEOG LR", duration: "2 hours" },
  { id: "timetable_133", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4810", startTime: "04:45 PM", endTime: "06:45 PM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_134", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "GEOG 4803", startTime: "09:45 AM", endTime: "11:45 AM", venue: "GIS LAB", duration: "2 hours" },
  { id: "timetable_135", dayOfWeek: "Thursday", programme: "BEDA/BEDL/BEDF48", courseCode: "FREN 4804", startTime: "04:45 PM", endTime: "06:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  // FRIDAY
  { id: "timetable_136", dayOfWeek: "Friday", programme: "BEDA12", courseCode: "BHHS 1201", startTime: "07:45 AM", endTime: "09:45 AM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_137", dayOfWeek: "Friday", programme: "BEDA12", courseCode: "BTRS 1205", startTime: "10:45 AM", endTime: "12:45 PM", venue: "H11", duration: "2 hours" },
  { id: "timetable_138", dayOfWeek: "Friday", programme: "BEDA12", courseCode: "GEOG 2402", startTime: "02:45 PM", endTime: "04:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_139", dayOfWeek: "Friday", programme: "BEDA12", courseCode: "ALLE 1201", startTime: "04:45 PM", endTime: "06:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_140", dayOfWeek: "Friday", programme: "BEDL12", courseCode: "GEOG 2402", startTime: "02:45 PM", endTime: "04:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_141", dayOfWeek: "Friday", programme: "BEDF12", courseCode: "GEOG 2402", startTime: "02:45 PM", endTime: "04:45 PM", venue: "LT1", duration: "2 hours" },
  { id: "timetable_142", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF24", courseCode: "CHIM 2401", startTime: "07:45 AM", endTime: "09:45 AM", venue: "R", duration: "2 hours" },
  { id: "timetable_143", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2402", startTime: "09:45 AM", endTime: "10:45 AM", venue: "LT1", duration: "1 hour" },
  { id: "timetable_144", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF24", courseCode: "ENGL 2401", startTime: "11:45 AM", endTime: "12:45 PM", venue: "ODLB", duration: "1 hour" },
  { id: "timetable_145", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF24", courseCode: "ALLE 2401", startTime: "12:45 PM", endTime: "02:45 PM", venue: "ODLB", duration: "2 hours" },
  { id: "timetable_146", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF24", courseCode: "HISM 2401", startTime: "03:45 PM", endTime: "05:45 PM", venue: "ODLC", duration: "2 hours" },
  { id: "timetable_147", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF24", courseCode: "BTRS 2406", startTime: "05:45 PM", endTime: "06:45 PM", venue: "ODLC", duration: "1 hour" },
  { id: "timetable_148", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF36", courseCode: "BTRS 3605", startTime: "07:45 AM", endTime: "08:45 AM", venue: "H11", duration: "1 hour" },
  { id: "timetable_149", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF36", courseCode: "ENGL 3601", startTime: "09:45 AM", endTime: "10:45 AM", venue: "ENG LR", duration: "1 hour" },
  { id: "timetable_150", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF36", courseCode: "ENGL 3602", startTime: "10:45 AM", endTime: "12:45 PM", venue: "GEOG LR", duration: "2 hours" },
  { id: "timetable_151", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF36", courseCode: "HISM 3601", startTime: "12:45 PM", endTime: "02:45 PM", venue: "MLR", duration: "2 hours" },
  { id: "timetable_152", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF36", courseCode: "GEOG 3603", startTime: "02:45 PM", endTime: "04:45 PM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_153", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF36", courseCode: "CHIM 3601", startTime: "04:45 PM", endTime: "06:45 PM", venue: "R", duration: "2 hours" },
  { id: "timetable_154", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "GEOG 4801", startTime: "07:45 AM", endTime: "09:45 AM", venue: "GEOSCIENCES LAB", duration: "2 hours" },
  { id: "timetable_155", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4808", startTime: "09:45 AM", endTime: "10:45 AM", venue: "R", duration: "1 hour" },
  { id: "timetable_156", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "FREN 4803", startTime: "10:45 AM", endTime: "12:45 PM", venue: "FRENCH LAB", duration: "2 hours" },
  { id: "timetable_157", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "ENGL 4801", startTime: "12:45 PM", endTime: "01:45 PM", venue: "GEOG LR", duration: "1 hour" },
  { id: "timetable_158", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "ALLE 4802", startTime: "01:45 PM", endTime: "03:45 PM", venue: "ENG LR", duration: "2 hours" },
  { id: "timetable_159", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "ENGM 4801", startTime: "04:45 PM", endTime: "05:45 PM", venue: "GEOG LR", duration: "1 hour" },
  { id: "timetable_160", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "GEOM 4801", startTime: "05:45 PM", endTime: "06:45 PM", venue: "GEOSCIENCES LAB", duration: "1 hour" },
  { id: "timetable_161", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "GEOG 4803", startTime: "07:45 AM", endTime: "09:45 AM", venue: "GIS LAB", duration: "2 hours" },
  { id: "timetable_162", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "CHIM 4801", startTime: "09:45 AM", endTime: "11:45 AM", venue: "MLR", duration: "2 hours" },
  { id: "timetable_163", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4802", startTime: "11:45 AM", endTime: "12:45 PM", venue: "D", duration: "1 hour" },
  { id: "timetable_164", dayOfWeek: "Friday", programme: "BEDA/BEDL/BEDF48", courseCode: "BTRS 4801", startTime: "01:45 PM", endTime: "02:45 PM", venue: "H11", duration: "1 hour" },
];

// ============================================
// IMPORT FUNCTION
// ============================================
async function importTimetable() {
  console.log(`Starting import of ${timetableData.length} timetable entries...`);
  
  let success = 0;
  let failed = 0;

  for (const entry of timetableData) {
    try {
      await setDoc(doc(db, "timetable", entry.id), {
        dayOfWeek: entry.dayOfWeek,
        programme: entry.programme,
        courseCode: entry.courseCode,
        startTime: entry.startTime,
        endTime: entry.endTime,
        venueName: entry.venue,
        duration: entry.duration,
        instructorEmail: "",
        createdAt: new Date().toISOString(),
      });
      success++;
      if (success % 10 === 0) {
        console.log(`✅ Uploaded ${success}/${timetableData.length} entries...`);
      }
    } catch (error) {
      console.error(`❌ Failed to upload ${entry.id}:`, error.message);
      failed++;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`Successfully uploaded: ${success}`);
  console.log(`Failed: ${failed}`);
  process.exit(0);
}

importTimetable();