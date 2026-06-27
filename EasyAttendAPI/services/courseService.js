const { db } = require('./firebaseAdmin');

async function addCourse({ courseCode, courseName }) {
  const existing = await db
    .collection('courses')
    .where('courseCode', '==', courseCode)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { id: existing.docs[0].id, ...existing.docs[0].data(), skipped: true };
  }

  const course = {
    courseCode,
    courseName,
    createdAt: new Date().toISOString(),
  };

  const docRef = await db.collection('courses').add(course);
  return { id: docRef.id, ...course };
}

async function getAllCourses() {
  const snapshot = await db.collection('courses').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = { addCourse, getAllCourses };