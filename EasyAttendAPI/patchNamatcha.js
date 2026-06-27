// node patchNamatcha.js
// Ensures namatcha's Firestore instructor doc has the correct courseCodes
// including BTRS 3606 (Wednesday class).
const https = require("https");
require("dotenv").config();

const API_KEY    = "AIzaSyBXu48Sc17V64gFvakIPHDG9LzEu_9sfF4";
const PROJECT_ID = "easyattend-b2bc0";
const EMAIL      = "namatcha@mzuni.ac.mw";
const PASSWORD   = "mzuni@2026";

const COURSE_CODES = [
  "BTRS 1206", "BTRS 1202", "BTRS 1205",
  "BTRS 2401", "BTRS 2402", "BTRS 2406", "BTRS 2407",
  "BTRS 3601", "BTRS 3606",   // BTRS 3606 = Wednesday 4:45PM venue S
];

function post(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => { let r = ""; res.on("data", c => r += c); res.on("end", () => resolve(JSON.parse(r))); }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function patch(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: "PATCH",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => { let r = ""; res.on("data", c => r += c); res.on("end", () => resolve(JSON.parse(r))); }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Sign in to get idToken for Firestore auth
  const signIn = await post("identitytoolkit.googleapis.com",
    `/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: EMAIL, password: PASSWORD, returnSecureToken: true }
  );
  if (!signIn.idToken) { console.error("Login failed:", signIn); return; }
  console.log("Signed in as", EMAIL);

  // Find instructor doc by querying email field
  const query = await post(`firestore.googleapis.com`,
    `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    {
      structuredQuery: {
        from: [{ collectionId: "instructors" }],
        where: { fieldFilter: { field: { fieldPath: "email" }, op: "EQUAL", value: { stringValue: EMAIL } } },
      }
    }
  );

  const docName = Array.isArray(query) && query[0]?.document?.name;
  const docPath = docName
    ? docName.replace(`projects/${PROJECT_ID}/databases/(default)/documents/`, "")
    : `instructors/${EMAIL.replace(/[@.]/g, "_")}`;

  console.log("Updating doc:", docPath);

  const fields = {
    email:       { stringValue: EMAIL },
    name:        { stringValue: "Namatcha" },
    courseCodes: { arrayValue: { values: COURSE_CODES.map(c => ({ stringValue: c })) } },
  };

  const updateMask = Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join("&");
  const result = await patch(
    "firestore.googleapis.com",
    `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${updateMask}`,
    { fields }
  );

  if (result.error) {
    console.error("Firestore update failed:", result.error.message);
  } else {
    console.log("✅ namatcha updated with courses:", COURSE_CODES.join(", "));
  }
}

main();
