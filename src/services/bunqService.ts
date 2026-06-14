/**
 * Bunq Payment Integration
 *
 * Bunq sendet Zahlungsbenachrichtigungen per Webhook.
 * Wenn eine Tap-to-Pay-Zahlung eingeht:
 *   1. Auftrag (Quote) anhand des Betrags / der Referenz finden
 *   2. Status auf 'PAID' setzen
 *   3. Lexoffice-Rechnungsentwurf triggern
 *
 * Docs: https://doc.bunq.com/#/notification-filter
 * ENV:  BUNQ_API_KEY, BUNQ_WEBHOOK_SECRET
 */

import crypto from "crypto";
import { prisma } from "@/lib/db";
import { createLexofficeInvoice } from "./lexofficeService";

/**
 * Verifiziert die HMAC-Signatur von Bunq (optional, aber empfohlen).
 * Bunq signiert Webhooks mit dem konfigurierten Secret.
 */
export function verifyBunqSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.BUNQ_WEBHOOK_SECRET;
  if (!secret) return true; // MOCK: Signatur überspringen in Entwicklung

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return signatureHeader === expected;
}

interface BunqPaymentEvent {
  amount: { value: string; currency: string };
  description: string;
  id: number;
}

/**
 * Findet den passenden Auftrag anhand Betrag und Referenz.
 * Bunq-Zahlungen enthalten die Angebotsnummer in der Beschreibung
 * (z.B. "Zahlung ANG-2026-1001").
 */
async function findQuoteForPayment(event: BunqPaymentEvent) {
  const amount = parseFloat(event.amount.value);
  const description = event.description ?? "";

  // Suche nach Angebotsnummer in der Beschreibung
  const quoteNumberMatch = description.match(/ANG-\d{4}-\d+/i);
  if (quoteNumberMatch) {
    const quote = await prisma.quote.findUnique({
      where: { quoteNumber: quoteNumberMatch[0].toUpperCase() },
      include: { customer: true, items: true },
    });
    if (quote) return quote;
  }

  // Fallback: Betrag-Matching (±0,01 € Toleranz)
  const quotes = await prisma.quote.findMany({
    where: {
      status: { in: ["SENT", "DRAFT"] },
      totalAmount: { gte: amount - 0.01, lte: amount + 0.01 },
    },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  return quotes[0] ?? null;
}

/**
 * Verarbeitet eine erfolgreiche Bunq-Zahlung:
 *   1. Auftrag als bezahlt markieren
 *   2. Lexoffice-Rechnung erstellen
 */
export async function processBunqPayment(event: BunqPaymentEvent) {
  const quote = await findQuoteForPayment(event);

  if (!quote) {
    console.warn("[bunq] Kein passender Auftrag gefunden für:", event);
    return { ok: false, reason: "no_quote_found" };
  }

  // Auftrag als PAID markieren
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "PAID",
      bunqPaymentId: String(event.id),
      paidAt: new Date(),
    },
  });

  console.log(`[bunq] Auftrag ${quote.quoteNumber} bezahlt (${event.amount.value} ${event.amount.currency})`);

  // Lexoffice-Rechnung erstellen
  const invoice = await createLexofficeInvoice(quote as Parameters<typeof createLexofficeInvoice>[0]);

  return {
    ok: true,
    quoteId: quote.id,
    quoteNumber: quote.quoteNumber,
    invoiceId: invoice?.id ?? null,
  };
}
