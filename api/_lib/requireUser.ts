import type { VercelRequest } from "@vercel/node";
import { getAdmin } from "./firebaseAdmin.js";

export type AppRole = "ADMIN" | "EDUCATOR" | "STUDENT";

export type RequiredUser = {
  uid: string;
  email?: string;
  role: AppRole;
  decoded: any;
  profile: any | null;
};

export async function requireUser(
  req: VercelRequest,
  opts?: { roles?: AppRole[] }
): Promise<RequiredUser> {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw new Error("Missing Authorization token");

  const admin = getAdmin();
  const decoded = await admin.auth().verifyIdToken(token);

  const db = admin.firestore();
  const userRef = db.doc(`users/${decoded.uid}`);
  const userSnap = await userRef.get();
  const profile = userSnap.exists ? userSnap.data() : null;

  const rawRole = String(profile?.role || "STUDENT").toUpperCase();
  const role: AppRole =
    rawRole === "ADMIN" || rawRole === "EDUCATOR" ? (rawRole as AppRole) : "STUDENT";

  if (opts?.roles?.length && !opts.roles.includes(role)) {
    throw new Error("Forbidden");
  }

  return {
    uid: decoded.uid,
    email: typeof decoded.email === "string" ? decoded.email : undefined,
    role,
    decoded,
    profile,
  };
}

