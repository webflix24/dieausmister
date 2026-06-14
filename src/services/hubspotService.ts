/**
 * HubSpot CRM Integration
 *
 * Empfängt neue Leads/Buchungen über das HubSpot-Kalendertool (Meetings)
 * und legt diese als neue Kunden + Touren im CRM an.
 *
 * Docs: https://developers.hubspot.com/docs/api/webhooks
 * ENV:  HUBSPOT_PRIVATE_APP_TOKEN, HUBSPOT_WEBHOOK_SECRET
 *
 * Webhook-Setup in HubSpot:
 *   Settings → Integrations → Private Apps → Dein App → Webhooks
 *   Event: contact.creation, deal.creation
 */

import axios from "axios";
import { prisma } from "@/lib/db";

const HUBSPOT_API = "https://api.hubapi.com";

function getHeaders() {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN ?? "TODO_HUBSPOT_TOKEN";
  return { Authorization: `Bearer ${token}` };
}

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip?: string;
    hs_meeting_start_time?: string;
    hs_meeting_title?: string;
    notes_last_contacted?: string;
  };
}

/**
 * Ruft einen HubSpot-Kontakt per ID ab.
 */
export async function fetchHubSpotContact(contactId: string): Promise<HubSpotContact | null> {
  if (!process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_PRIVATE_APP_TOKEN === "TODO_HUBSPOT_TOKEN") {
    // MOCK
    return {
      id: contactId,
      properties: {
        firstname: "Max",
        lastname: "Testmann",
        email: "max.testmann@example.de",
        phone: "0176 9988 7766",
        city: "München",
        hs_meeting_start_time: new Date(Date.now() + 86400000).toISOString(),
        hs_meeting_title: "Kostenloser Besichtigungstermin",
      },
    };
  }

  try {
    const res = await axios.get(
      `${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone,address,city,zip,hs_meeting_start_time,hs_meeting_title`,
      { headers: getHeaders() }
    );
    return res.data;
  } catch (err) {
    console.error("[hubspot] fetchContact error:", err);
    return null;
  }
}

/**
 * Synchronisiert einen HubSpot-Lead ins CRM:
 *   1. Prüft ob Kunde bereits existiert (per E-Mail / Telefon)
 *   2. Legt neuen Kunden an oder aktualisiert existierenden
 *   3. Falls ein Meeting-Termin vorhanden: Tour anlegen
 */
export async function syncHubSpotLead(contactId: string): Promise<{
  action: "created" | "updated" | "skipped";
  customerId?: string;
  tourId?: string;
}> {
  const contact = await fetchHubSpotContact(contactId);
  if (!contact) return { action: "skipped" };

  const p = contact.properties;
  const email = p.email ?? undefined;
  const phone = p.phone ?? undefined;

  // Duplikat-Prüfung
  let existing = null;
  if (email) {
    existing = await prisma.customer.findFirst({ where: { email } });
  }
  if (!existing && phone) {
    existing = await prisma.customer.findFirst({ where: { phone } });
  }

  const customerData = {
    firstName: p.firstname ?? "Unbekannt",
    lastName: p.lastname ?? "",
    email: email ?? null,
    phone: phone ?? null,
    address: p.address ?? null,
    city: p.city ?? null,
    postalCode: p.zip ?? null,
    hubspotId: contact.id,
    notes: p.notes_last_contacted ? `HubSpot-Notiz: ${p.notes_last_contacted}` : null,
  };

  let customer;
  let action: "created" | "updated" = "created";

  if (existing) {
    customer = await prisma.customer.update({
      where: { id: existing.id },
      data: { ...customerData },
    });
    action = "updated";
    console.log(`[hubspot] Kunde aktualisiert: ${customer.firstName} ${customer.lastName}`);
  } else {
    customer = await prisma.customer.create({ data: customerData });
    console.log(`[hubspot] Neuer Kunde: ${customer.firstName} ${customer.lastName}`);
  }

  // Meeting-Termin als Tour anlegen
  let tourId: string | undefined;
  if (p.hs_meeting_start_time) {
    const meetingDate = new Date(p.hs_meeting_start_time);
    const tour = await prisma.tour.create({
      data: {
        title: p.hs_meeting_title ?? `Besichtigungstermin ${customer.firstName} ${customer.lastName}`,
        date: meetingDate,
        startTime: meetingDate.toTimeString().slice(0, 5),
        customerId: customer.id,
        city: customer.city ?? undefined,
        address: customer.address ?? undefined,
        status: "PLANNED",
        notes: "Via HubSpot Kalendertool gebucht",
      },
    });
    tourId = tour.id;
    console.log(`[hubspot] Tour erstellt: ${tour.title} am ${meetingDate.toLocaleDateString("de-DE")}`);
  }

  return { action, customerId: customer.id, tourId };
}
