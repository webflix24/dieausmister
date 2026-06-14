/**
 * POST /api/integrations/lexoffice
 *
 * Manuelles Triggern einer Lexoffice-Rechnung für einen Auftrag.
 * Body: { quoteId: string }
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLexofficeInvoice } from "@/services/lexofficeService";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { quoteId } = await req.json();
  if (!quoteId) return Response.json({ error: "quoteId fehlt" }, { status: 400 });

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { customer: true, items: true },
  });

  if (!quote) return Response.json({ error: "Angebot nicht gefunden" }, { status: 404 });
  if (quote.lexofficeId) {
    return Response.json({ ok: true, lexofficeId: quote.lexofficeId, alreadyCreated: true });
  }

  const invoice = await createLexofficeInvoice(quote as Parameters<typeof createLexofficeInvoice>[0]);

  if (!invoice) {
    return Response.json({ error: "Lexoffice-Rechnung konnte nicht erstellt werden" }, { status: 500 });
  }

  return Response.json({ ok: true, invoiceId: invoice.id, resourceUri: invoice.resourceUri });
}
