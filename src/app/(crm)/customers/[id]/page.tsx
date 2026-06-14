import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import CustomerForm from "@/components/customers/CustomerForm";
import Link from "next/link";
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, TOUR_STATUS_LABELS } from "@/lib/utils";
import DeleteButton from "@/components/customers/DeleteButton";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      quotes: { orderBy: { createdAt: "desc" } },
      tours: { orderBy: { date: "desc" } },
    },
  });

  if (!customer) notFound();

  return (
    <>
      <Header title={`${customer.firstName} ${customer.lastName}`} />
      <main className="flex-1 p-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link href="/customers" className="text-sm text-gray-500 hover:text-gray-800">
            ← Alle Kunden
          </Link>
          <div className="flex gap-2">
            <Link
              href={`/quotes/new?customerId=${customer.id}`}
              className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              + Angebot erstellen
            </Link>
            <Link
              href={`/tours/new?customerId=${customer.id}`}
              className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              + Tour planen
            </Link>
            <DeleteButton customerId={customer.id} />
          </div>
        </div>

        <CustomerForm
          customerId={customer.id}
          initialData={{
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email ?? undefined,
            phone: customer.phone ?? undefined,
            address: customer.address ?? undefined,
            city: customer.city ?? undefined,
            postalCode: customer.postalCode ?? undefined,
            notes: customer.notes ?? undefined,
          }}
        />

        {customer.quotes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Angebote ({customer.quotes.length})</h2>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-500">Nummer</th>
                  <th className="text-left py-2 font-medium text-gray-500">Betrag</th>
                  <th className="text-left py-2 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2 font-medium text-gray-500">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {customer.quotes.map((q) => (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5">
                      <Link href={`/quotes/${q.id}`} className="text-orange-600 hover:underline font-medium">
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td className="py-2.5">{formatCurrency(q.totalAmount)}</td>
                    <td className="py-2.5">
                      <QuoteBadge status={q.status} />
                    </td>
                    <td className="py-2.5 text-gray-400">{formatDate(q.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {customer.tours.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Touren ({customer.tours.length})</h2>
            <div className="space-y-2">
              {customer.tours.map((t) => (
                <Link key={t.id} href={`/tours/${t.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(t.date)}{t.startTime ? `, ${t.startTime}` : ""}</p>
                  </div>
                  <TourBadge status={t.status} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function QuoteBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SENT: "bg-blue-100 text-blue-600",
    ACCEPTED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {QUOTE_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function TourBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-600",
    IN_PROGRESS: "bg-yellow-100 text-yellow-600",
    COMPLETED: "bg-green-100 text-green-600",
    CANCELLED: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {TOUR_STATUS_LABELS[status] ?? status}
    </span>
  );
}
