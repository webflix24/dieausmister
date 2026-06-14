/**
 * POST /api/webhooks/bunq
 *
 * Bunq sendet Zahlungsbenachrichtigungen wenn:
 *   - Tap-to-Pay auf dem Mitarbeiter-Handy erfolgreich
 *   - Überweisung eingegangen
 *
 * Einrichten in Bunq Business App:
 *   Einstellungen → Webhooks → URL: https://your-domain.de/api/webhooks/bunq
 *   Kategorie: MUTATION (alle Buchungen)
 */

import { NextRequest } from "next/server";
import { verifyBunqSignature, processBunqPayment } from "@/services/bunqService";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-bunq-client-signature");

  // Signatur-Verifikation
  if (!verifyBunqSignature(rawBody, signature)) {
    console.warn("[bunq webhook] Ungültige Signatur");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    NotificationUrl?: {
      category?: string;
      object?: {
        Payment?: {
          amount: { value: string; currency: string };
          description: string;
          id: number;
          type: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = payload.NotificationUrl?.category;
  const payment = payload.NotificationUrl?.object?.Payment;

  // Nur eingehende Zahlungen (PAYMENT) verarbeiten
  if (category !== "MUTATION" || !payment) {
    return Response.json({ ok: true, skipped: true });
  }

  // Nur positive Beträge (Einnahmen) verarbeiten
  const amount = parseFloat(payment.amount.value);
  if (amount <= 0) {
    return Response.json({ ok: true, skipped: "outgoing_payment" });
  }

  console.log(`[bunq webhook] Zahlung: ${amount} ${payment.amount.currency} – "${payment.description}"`);

  const result = await processBunqPayment({
    amount: payment.amount,
    description: payment.description,
    id: payment.id,
  });

  return Response.json(result);
}
