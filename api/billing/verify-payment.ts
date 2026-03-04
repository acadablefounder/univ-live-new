import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: "Deprecated: Subscription-based billing has been removed. Seats are now assigned by Admin.",
    endpoint: "/api/billing/verify-payment",
  });
}
