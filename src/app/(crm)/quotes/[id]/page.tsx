import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from "@/lib/utils";
import QuoteActions from "@/components/quotes/QuoteActions";

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, items: true },
  });

  if (!quote) notFound();

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SENT: "bg-blue-100 text-blue-600",
    ACCEPTED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };

  if (edit === "1") {
    const customers = await prisma.customer.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    });
    const QuoteForm = (await import("@/components/quotes/QuoteForm")).default;
    return (
      <>
        <Header title={`Angebot ${quote.quoteNumber} bearbeiten`} />
        <main className="flex-1 p-6 max-w-4xl">
          <Link href={`/quotes/${id}`} className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
            ← Zurück
          </Link>
          <QuoteForm
            customers={customers}
            quoteId={id}
            initialData={{
              customerId: quote.customerId,
              status: quote.status as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED",
              notes: quote.notes ?? undefined,
              validUntil: quote.validUntil ? quote.validUntil.toISOString().split("T")[0] : undefined,
              items: quote.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                total: item.total,
              })),
            }}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Header title={`Angebot ${quote.quoteNumber}`} />
      <main className="flex-1 p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/quotes" className="text-sm text-gray-500 hover:text-gray-800">
            ← Alle Angebote
          </Link>
          <QuoteActions quoteId={id} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6 print:shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-1">
                <span>🏠</span>
                <span>Die Ausmister</span>
              </div>
              <p className="text-gray-500 text-sm">Professionelle Entrümpelung & Haushaltsauflösung</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">{quote.quoteNumber}</p>
              <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[quote.status]}`}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Angebotsempfänger</p>
              <p className="font-semibold text-gray-900">{quote.customer.firstName} {quote.customer.lastName}</p>
              {quote.customer.address && <p className="text-gray-600 text-sm">{quote.customer.address}</p>}
              {quote.customer.city && (
                <p className="text-gray-600 text-sm">{quote.customer.postalCode} {quote.customer.city}</p>
              )}
              {quote.customer.phone && <p className="text-gray-500 text-sm">{quote.customer.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Angebotsdaten</p>
              <p className="text-sm text-gray-600">Erstellt: {formatDate(quote.createdAt)}</p>
              {quote.validUntil && (
                <p className="text-sm text-gray-600">Gültig bis: {formatDate(quote.validUntil)}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-gray-200">
                <tr>
                  <th className="text-left py-2 font-semibold text-gray-700">Pos.</th>
                  <th className="text-left py-2 font-semibold text-gray-700">Beschreibung</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Menge</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Einheit</th>
                  <th className="text-right py-2 font-semibold text-gray-700">EP (€)</th>
                  <th className="text-right py-2 font-semibold text-gray-700">Gesamt (€)</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 text-gray-800">{item.description}</td>
                    <td className="py-2.5 text-right">{item.quantity}</td>
                    <td className="py-2.5 text-right text-gray-500">{item.unit}</td>
                    <td className="py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={5} className="py-3 text-right font-bold text-gray-900 pr-4">
                    Gesamtbetrag (netto):
                  </td>
                  <td className="py-3 text-right font-bold text-xl text-orange-600">
                    {formatCurrency(quote.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {quote.notes && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Anmerkungen</p>
              <p className="text-sm text-gray-600">{quote.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400">
            <p>Alle Preise zzgl. gesetzlicher Mehrwertsteuer. Dieses Angebot ist freibleibend.</p>
          </div>
        </div>
      </main>
    </>
  );
}
