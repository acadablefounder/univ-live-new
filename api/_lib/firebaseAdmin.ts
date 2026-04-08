import admin from "firebase-admin";

let inited = false;

export function getAdmin() {
  if (!inited) {
    try {
      const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!json) {
        throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
      }

      console.log("[firebaseAdmin] Parsing service account JSON (length:", json.length, "chars)");
      
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(json);
      } catch (parseErr: any) {
        console.error("[firebaseAdmin] JSON parse failed:", parseErr.message);
        console.error("[firebaseAdmin] JSON content (first 200 chars):", json.substring(0, 200));
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${parseErr.message}`);
      }

      if (!serviceAccount.project_id) {
        throw new Error("Service account JSON missing project_id field");
      }

      console.log("[firebaseAdmin] Service account loaded for project:", serviceAccount.project_id);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
      });

      inited = true;
      console.log("[firebaseAdmin] ✅ Firebase admin initialized successfully");
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error("[firebaseAdmin] ❌ Initialization failed:", msg);
      throw e;
    }
  }
  return admin;
}
