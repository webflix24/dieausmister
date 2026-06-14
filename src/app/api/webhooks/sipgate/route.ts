/**
 * POST /api/webhooks/sipgate
 *
 * Sipgate sendet bei jedem Call-Event eine XML-Anfrage an diesen Endpunkt.
 * In der Sipgate-Konsole eintragen: https://your-domain.de/api/webhooks/sipgate
 *
 * Events:
 *   newCall  → eingehender Anruf, Nummernabgleich
 *   hangup   → Gespräch beendet, AI-Zusammenfassung laden
 */

import { NextRequest } from "next/server";
import {
  findCustomerByPhone,
  logIncomingCall,
  processCallHangup,
} from "@/services/sipgateService";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = await req.json();
  } else {
    // Sipgate sendet oft application/x-www-form-urlencoded
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const event = body.event ?? body.type ?? "";
  const callId = body.callId ?? body.sessionId ?? "";
  const from = body.from ?? body.callerNumber ?? "";
  const direction = body.direction ?? "in";

  console.log(`[sipgate webhook] event=${event} callId=${callId} from=${from}`);

  if (event === "newCall" && direction !== "out") {
    const customer = await findCustomerByPhone(from);
    await logIncomingCall({
      callId,
      phoneNumber: from,
      customerId: customer?.id,
    });

    // Sipgate erwartet eine XML-Antwort um z.B. die Ansage zu steuern
    // Wir spielen die Standard-Ansage ab (kein Action-Block = Standardverhalten)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Kein Action: Normales Klingelverhalten -->
  <!-- Kunde: ${customer ? `${customer.firstName} ${customer.lastName}` : "Unbekannt"} -->
</Response>`,
      {
        headers: { "Content-Type": "application/xml" },
      }
    );
  }

  if (event === "hangup") {
    const duration = parseInt(body.duration ?? "0", 10);
    const result = await processCallHangup({ callId, duration, phoneNumber: from });
    return Response.json({ ok: true, ...result });
  }

  // Alle anderen Events (answer, etc.) ignorieren
  return Response.json({ ok: true, event });
}
