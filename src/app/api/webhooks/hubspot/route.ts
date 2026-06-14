/**
 * POST /api/webhooks/hubspot
 *
 * HubSpot sendet Ereignisse für neue Kontakte und Meetings.
 *
 * Einrichten in HubSpot:
 *   Private App → Webhooks → URL: https://your-domain.de/api/webhooks/hubspot
 *   Abonnieren: contact.creation, contact.propertyChange
 */

import { NextRequest } from "next/server";
import crypto from "crypto";
import { syncHubSpotLead } from "@/services/hubspotService";

function verifyHubSpotSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.HUBSPOT_WEBHOOK_SECRET;
  if (!secret) return true; // MOCK: Verifikation überspringen

  const signature = req.headers.get("x-hubspot-signature-v3") ?? "";
  const uri = req.nextUrl.toString();
  const timestamp = req.headers.get("x-hubspot-request-timestamp") ?? "";

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`POST${uri}${rawBody}${timestamp}`)
    .digest("hex");

  return signature === expected;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyHubSpotSignature(req, rawBody)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let events: { subscriptionType: string; objectId?: number; propertyValue?: string }[];
  try {
    events = JSON.parse(rawBody);
    if (!Array.isArray(events)) events = [events];
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const results = [];

  for (const event of events) {
    const { subscriptionType, objectId } = event;

    if (
      (subscriptionType === "contact.creation" ||
        subscriptionType === "contact.propertyChange") &&
      objectId
    ) {
      const result = await syncHubSpotLead(String(objectId));
      results.push({ objectId, ...result });
    }
  }

  return Response.json({ ok: true, processed: results.length, results });
}
