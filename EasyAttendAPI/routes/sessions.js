const express = require('express');
const router = express.Router();

const {
  getSessionDetails,
  getSessionRecords,
} = require('../services/attendanceService');

const { generateAttendancePDF } = require('../services/pdfService');

// GET /api/sessions/:sessionId/report -> generates and downloads PDF
router.get('/sessions/:sessionId/report', async (req, res) => {
  try {
    const session = await getSessionDetails(req.params.sessionId);
    const records = await getSessionRecords(req.params.sessionId);

    const pdfPath = await generateAttendancePDF(session, records);

    res.download(pdfPath, `Attendance_${session.courseCode}_${session.date}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;