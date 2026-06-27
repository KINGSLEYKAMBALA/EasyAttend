// node createAdmin.js
// Creates the admin Firebase Auth account via REST API
const https = require("https");
require("dotenv").config();

const API_KEY  = "AIzaSyBXu48Sc17V64gFvakIPHDG9LzEu_9sfF4";
const EMAIL    = "kambalakingsley@mail.com";
const PASSWORD = "Admin@2026";

function post(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => { let r = ""; res.on("data", c => r += c); res.on("end", () => resolve(JSON.parse(r))); }
    );
    req.on("error", reject);
    req.write(data); req.end();
  });
}

async function main() {
  console.log("Creating admin account:", EMAIL);

  // Try sign-up first
  const signup = await post("identitytoolkit.googleapis.com",
    `/v1/accounts:signUp?key=${API_KEY}`,
    { email: EMAIL, password: PASSWORD, returnSecureToken: true }
  );

  if (signup.error) {
    if (signup.error.message === "EMAIL_EXISTS") {
      console.log("Account already exists. Verifying password...");
      const signin = await post("identitytoolkit.googleapis.com",
        `/v1/accounts:signInWithPassword?key=${API_KEY}`,
        { email: EMAIL, password: PASSWORD, returnSecureToken: true }
      );
      if (signin.error) {
        console.log("⚠️  Account exists but password is wrong.");
        console.log("Go to Firebase Console → Authentication → Users");
        console.log("Find", EMAIL, "→ Reset password to:", PASSWORD);
      } else {
        console.log("✅ Account exists and password is correct. You can log in now.");
        console.log("   Email:   ", EMAIL);
        console.log("   Password:", PASSWORD);
      }
    } else {
      console.error("❌ Failed to create account:", signup.error.message);
    }
    return;
  }

  console.log("✅ Admin account created successfully!");
  console.log("   Email:   ", EMAIL);
  console.log("   Password:", PASSWORD);
}

main();
