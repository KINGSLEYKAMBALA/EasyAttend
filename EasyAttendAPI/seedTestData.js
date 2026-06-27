const {
  createTestSession,
  addAttendanceRecord,
} = require('./services/attendanceService');

async function seed() {
  const session = await createTestSession({
    courseCode: 'BICT2201',
    courseName: 'Database Systems',
    venue: 'LR 4',
    date: '2026-06-24',
  });
  console.log('✅ Session created:', session.id);

  await addAttendanceRecord(session.id, {
    name: 'Chisomo Banda',
    regNumber: 'BICT1501',
    checkInTime: '08:05',
    checkOutTime: '09:58',
  });

  await addAttendanceRecord(session.id, {
    name: 'Thandiwe Phiri',
    regNumber: 'BICT1522',
    checkInTime: '08:07',
    checkOutTime: '10:00',
  });

  console.log('✅ Attendance records added');
  console.log('SESSION ID TO USE:', session.id);
}

seed().catch((err) => console.error('❌ Failed:', err));