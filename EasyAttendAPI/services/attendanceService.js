// Uses Firestore REST API directly — no Admin SDK needed.
const https = require('https');

const PROJECT_ID = 'easyattend-b2bc0';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function firestoreGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${FIRESTORE_BASE}/${path}`);
    https.get({ hostname: url.hostname, path: url.pathname + url.search }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Invalid JSON from Firestore')); }
      });
    }).on('error', reject);
  });
}

function firestoreQuery(collection, field, value) {
  const body = JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        fieldFilter: {
          field: { fieldPath: field },
          op: 'EQUAL',
          value: { stringValue: value },
        },
      },
    },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error('Invalid JSON from Firestore query')); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Convert Firestore REST field value to plain JS value
function unwrap(val) {
  if (!val) return null;
  if ('stringValue'    in val) return val.stringValue;
  if ('integerValue'   in val) return parseInt(val.integerValue);
  if ('doubleValue'    in val) return val.doubleValue;
  if ('booleanValue'   in val) return val.booleanValue;
  if ('nullValue'      in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue'     in val) return (val.arrayValue.values || []).map(unwrap);
  if ('mapValue'       in val) return unwrapFields(val.mapValue.fields || {});
  return null;
}

function unwrapFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) obj[k] = unwrap(v);
  return obj;
}

function docToObject(doc) {
  if (!doc || !doc.fields) return null;
  const id = (doc.name || '').split('/').pop();
  return { id, ...unwrapFields(doc.fields) };
}

async function getSessionDetails(sessionId) {
  const doc = await firestoreGet(`sessions/${sessionId}`);
  if (doc.error) throw new Error(doc.error.message || 'Session not found');
  return docToObject(doc);
}

async function getSessionRecords(sessionId) {
  const results = await firestoreQuery('attendance', 'sessionId', sessionId);
  return results
    .filter((r) => r.document)
    .map((r) => docToObject(r.document));
}

module.exports = { getSessionDetails, getSessionRecords };
