/**
 * Lexoffice API Integration
 *
 * Erstellt automatisch Rechnungsentwürfe aus CRM-Aufträgen.
 * 19% MwSt wird automatisch berechnet.
 *
 * Docs: https://developers.lexoffice.io/docs/
 * ENV:  LEXOFFICE_API_KEY
 */

import axios from "axios";

const LEXOFFICE_BASE = "https://api.lexoffice.io/v1";

function getHeaders() {
  const key = process.env.LEXOFFICE_API_KEY ?? "TODO_LEXOFFICE_API_KEY";
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

interface QuoteForInvoice {
  id: string;
  quoteNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
  };
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }[];
  totalAmount: number;
  notes?: string | null;
}

interface LexofficeInvoice {
  id: string;
  resourceUri: string;
}

/**
 * Baut das Lexoffice-Rechnungsobjekt aus CRM-Daten.
 * MwSt: 19% (taxType: "gross" = inkl. MwSt, "net" = zzgl. MwSt)
 * Hier: Nettopreise + 19% MwSt ausweisen (Standard für Gewerbe).
 */
function buildInvoicePayload(quote: QuoteForInvoice) {
  const lineItems = quote.items.map((item) => ({
    type: "custom",
    name: item.description,
    quantity: item.quantity,
    unitName: item.unit,
    unitPrice: {
      currency: "EUR",
      netAmount: item.unitPrice,
      taxRatePercentage: 19,
    },
    discountPercentage: 0,
  }));

  return {
    voucherDate: new Date().toISOString(),
    address: {
      name: `${quote.customer.firstName} ${quote.customer.lastName}`,
      street: quote.customer.address ?? undefined,
      city: quote.customer.city ?? undefined,
      zip: quote.customer.postalCode ?? undefined,
      countryCode: "DE",
    },
    lineItems,
    totalPrice: {
      currency: "EUR",
    },
    taxConditions: {
      taxType: "net",
    },
    shippingConditions: {
      shippingDate: new Date().toISOString(),
      shippingType: "service",
    },
    introduction: `Rechnung zu Auftrag ${quote.quoteNumber}`,
    remark: quote.notes ?? "Vielen Dank für Ihren Auftrag!",
  };
}

/**
 * Erstellt einen Rechnungsentwurf in Lexoffice.
 * Gibt die Lexoffice-Rechnungs-ID zurück.
 *
 * MOCK: Wenn kein API-Key hinterlegt ist, wird eine Mock-Antwort zurückgegeben.
 */
export async function createLexofficeInvoice(
  quote: QuoteForInvoice
): Promise<LexofficeInvoice | null> {
  if (!process.env.LEXOFFICE_API_KEY || process.env.LEXOFFICE_API_KEY === "TODO_LEXOFFICE_API_KEY") {
    console.log(`[lexoffice MOCK] Rechnungsentwurf für ${quote.quoteNumber} erstellt`);
    const mockId = `mock-invoice-${Date.now()}`;
    // In DB speichern
    await updateQuoteWithLexofficeId(quote.id, mockId);
    return { id: mockId, resourceUri: `/v1/invoices/${mockId}` };
  }

  try {
    const payload = buildInvoicePayload(quote);
    const res = await axios.post<LexofficeInvoice>(
      `${LEXOFFICE_BASE}/invoices?finalize=false`,
      payload,
      { headers: getHeaders(), timeout: 15_000 }
    );

    const invoice = res.data;
    await updateQuoteWithLexofficeId(quote.id, invoice.id);
    console.log(`[lexoffice] Rechnung erstellt: ${invoice.id}`);
    return invoice;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error("[lexoffice] API Fehler:", err.response?.data ?? err.message);
    } else {
      console.error("[lexoffice] Fehler:", err);
    }
    return null;
  }
}

async function updateQuoteWithLexofficeId(quoteId: string, lexofficeId: string) {
  const { prisma } = await import("@/lib/db");
  await prisma.quote.update({
    where: { id: quoteId },
    data: { lexofficeId },
  });
}

/**
 * Ruft den Status einer Lexoffice-Rechnung ab.
 */
export async function getLexofficeInvoice(
  invoiceId: string
): Promise<{ status: string; voucherNumber?: string } | null> {
  if (invoiceId.startsWith("mock-")) {
    return { status: "draft", voucherNumber: `MOCK-${invoiceId}` };
  }

  try {
    const res = await axios.get(`${LEXOFFICE_BASE}/invoices/${invoiceId}`, {
      headers: getHeaders(),
      timeout: 10_000,
    });
    return { status: res.data.voucherStatus, voucherNumber: res.data.voucherNumber };
  } catch (err) {
    console.error("[lexoffice] getLexofficeInvoice error:", err);
    return null;
  }
}
