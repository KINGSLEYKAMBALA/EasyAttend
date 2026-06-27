const { generateAttendancePDF } = require('./services/pdfService');

const fakeSession = {
  courseCode: 'BICT2201',
  courseName: 'Database Systems',
  venue: 'LR 4',
  date: '2026-06-24',
};

const fakeRecords = [
  { name: 'Chisomo Banda', regNumber: 'BICT1501', checkInTime: '08:05', checkOutTime: '09:58' },
  { name: 'Thandiwe Phiri', regNumber: 'BICT1522', checkInTime: '08:07', checkOutTime: '10:00' },
];

generateAttendancePDF(fakeSession, fakeRecords)
  .then((path) => console.log('✅ PDF created at:', path))
  .catch((err) => console.error('❌ Failed:', err));