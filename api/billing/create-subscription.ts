import type { VercelRequest, VercelResponse } from "@vercel/node";
import { razorpayRequest } from "../_lib/razorpayRequest.js";
import { getAdmin } from "../_lib/firebaseAdmin.js"; 
import { requireUser } from "../_lib/requireUser.js";

function planId(planKey: string) {
  const key = planKey.toUpperCase();
  if (key === "ESSENTIAL") return process.env.RAZORPAY_PLAN_ESSENTIAL_ID!;
  if (key === "GROWTH") return process.env.RAZORPAY_PLAN_GROWTH_ID!;
  return "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const user = await requireUser(req, { roles: ["EDUCATOR", "ADMIN"] });
    const educatorId = user.uid;

    const { planKey, quantity } = req.body || {};
    const pk = String(planKey || "").toUpperCase();
    const qty = Math.max(1, Math.floor(Number(quantity || 1)));

    const rpPlanId = planId(pk);
    if (!rpPlanId) return res.status(400).json({ error: "Invalid planKey" });

    const admin = getAdmin();
    const db = admin.firestore();

    const subRef = db.doc(`educators/${educatorId}/billing/subscription`);
    const subSnap = await subRef.get();
    const subData = subSnap.data() || {};

    // Create customer once
    let customerId = String(subData.razorpayCustomerId || "");
    if (!customerId) {
      const educatorSnap = await db.doc(`educators/${educatorId}`).get();
      const educator = educatorSnap.data() || {};
      const customer = await razorpayRequest("customers", "POST", {
        name: String(educator.coachingName || educator.name || "Univ.live Coaching"),
        email: String(user.email || educator.email || ""),
        contact: String(educator.phone || ""),
        notes: { educatorId },
      });
      customerId = customer.id;
    }

    // 5-day trial: during this time, status is "created" but access is allowed (seat assignment too)
    const trialDays = 5;
    const startAt = Math.floor(Date.now() / 1000) + trialDays * 86400;

    const subscription = await razorpayRequest("subscriptions", "POST", {
      plan_id: rpPlanId,
      quantity: qty,
      total_count: 1200,
      customer_notify: 1,
      start_at: startAt,
      customer_id: customerId,
      notes: { educatorId, planKey: pk },
    });

    // mapping: helps webhook find educatorId reliably
    await db.doc(`razorpaySubscriptions/${subscription.id}`).set(
      {
        educatorId,
        planKey: pk,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await subRef.set(
      {
        planKey: pk,
        status: String(subscription.status || "created"),
        quantity: qty,
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: customerId,
        startAt: admin.firestore.Timestamp.fromMillis(startAt * 1000),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

