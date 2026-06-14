/**
 * Sipgate Neo / Satellite CTI Integration
 *
 * Eingehende Anrufe werden per Webhook gemeldet.
 * Nach Auflegen wird die AI-Zusammenfassung abgerufen und in der
 * Kunden-Historie gespeichert.
 *
 * Docs: https://developer.sipgate.io/
 * ENV:  SIPGATE_TOKEN_ID, SIPGATE_TOKEN, SIPGATE_WEBHOOK_SECRET
 */

import axios from "axios";
import { prisma } from "@/lib/db";

const SIPGATE_BASE = "https://api.sipgate.com/v2";

function getAuthHeader() {
  const tokenId = process.env.SIPGATE_TOKEN_ID ?? "TODO_SIPGATE_TOKEN_ID";
  const token = process.env.SIPGATE_TOKEN ?? "TODO_SIPGATE_TOKEN";
  const encoded = Buffer.from(`${tokenId}:${token}`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Normalisiert eine Telefonnummer in E.164-Format (+49...)
 * für den DB-Abgleich.
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+49${digits.slice(1)}`;
  if (!digits.startsWith("49")) return `+49${digits}`;
  return `+${digits}`;
}

/**
 * Sucht einen Kunden anhand seiner Telefonnummer in der DB.
 */
export async function findCustomerByPhone(rawPhone: string) {
  const normalized = normalizePhone(rawPhone);
  // Suche nach verschiedenen Schreibweisen
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { phone: { contains: rawPhone } },
        { phone: { contains: normalized } },
        { phone: { contains: rawPhone.replace(/\D/g, "") } },
      ],
    },
    take: 1,
  });
  return customers[0] ?? null;
}

/**
 * Erstellt einen CallHistory-Eintrag wenn ein Anruf eingeht.
 */
export async function logIncomingCall(params: {
  callId: string;
  phoneNumber: string;
  customerId?: string;
}) {
  return prisma.callHistory.upsert({
    where: { callId: params.callId },
    create: {
      callId: params.callId,
      phoneNumber: params.phoneNumber,
      customerId: params.customerId,
      direction: "INBOUND",
    },
    update: {},
  });
}

/**
 * Ruft die Sipgate AI-Zusammenfassung eines abgeschlossenen Anrufs ab.
 * Die Call-Summary-API ist Teil von Sipgate Neo / AI-Features.
 *
 * MOCK: Gibt Beispieldaten zurück bis die echten Credentials hinterlegt sind.
 */
export async function fetchCallSummary(callId: string): Promise<string | null> {
  if (!process.env.SIPGATE_TOKEN || process.env.SIPGATE_TOKEN === "TODO_SIPGATE_TOKEN") {
    // MOCK – Platzhalter für lokale Entwicklung
    return `[MOCK] Anruf ${callId}: Kunde fragt nach Termin für 3-Zimmer-Wohnung in München. Bevorzugt Samstag. Bittet um Rückruf zur Bestätigung.`;
  }

  try {
    // TODO: Endpunkt aus Sipgate AI-Doku prüfen – ggf. /v2/calls/{callId}/summary
    const res = await axios.get(`${SIPGATE_BASE}/calls/${callId}/summary`, {
      headers: { Authorization: getAuthHeader() },
      timeout: 10_000,
    });
    return res.data?.summary ?? null;
  } catch (err) {
    console.error("[sipgate] fetchCallSummary error:", err);
    return null;
  }
}

/**
 * Nach Gesprächsende: AI-Zusammenfassung abrufen und in DB speichern.
 * Wird vom Webhook ausgelöst (event: "hangup").
 */
export async function processCallHangup(params: {
  callId: string;
  duration: number;
  phoneNumber: string;
}) {
  const summary = await fetchCallSummary(params.callId);

  // CallHistory aktualisieren
  await prisma.callHistory.updateMany({
    where: { callId: params.callId },
    data: {
      duration: params.duration,
      aiSummary: summary,
    },
  });

  // Kunden-Notiz automatisch ergänzen (optional, falls Kunde bekannt)
  const call = await prisma.callHistory.findUnique({
    where: { callId: params.callId },
    include: { customer: true },
  });

  if (call?.customerId && summary) {
    const timestamp = new Date().toLocaleString("de-DE");
    await prisma.customer.update({
      where: { id: call.customerId },
      data: {
        notes: call.customer?.notes
          ? `${call.customer.notes}\n\n[${timestamp}] Anruf-Zusammenfassung:\n${summary}`
          : `[${timestamp}] Anruf-Zusammenfassung:\n${summary}`,
      },
    });
  }

  return { callId: params.callId, summary };
}
