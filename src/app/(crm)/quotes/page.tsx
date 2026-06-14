import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const quotes = await prisma.quote.findMany({
    where:
      status === "open"
        ? { status: { in: ["DRAFT", "SENT"] } }
        : status
        ? { status }
        : undefined,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SENT: "bg-blue-100 text-blue-600",
    ACCEPTED: "bg-green-100 text-green-600",
    REJECTED: "bg-red-100 text-red-600",
  };

  const filters = [
    { label: "Alle", value: "" },
    { label: "Entwurf", value: "DRAFT" },
    { label: "Versendet", value: "SENT" },
    { label: "Angenommen", value: "ACCEPTED" },
    { label: "Abgelehnt", value: "REJECTED" },
  ];

  return (
    <>
      <Header title="Angebote" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            {filters.map((f) => (
              <Link
                key={f.value}
                href={f.value ? `/quotes?status=${f.value}` : "/quotes"}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  (status ?? "") === f.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <Link
            href="/quotes/new"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neues Angebot
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nummer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Kunde</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Betrag</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Gültig bis</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Erstellt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Keine Angebote gefunden.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/quotes/${q.id}`} className="font-medium text-orange-600 hover:underline">
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <Link href={`/customers/${q.customer.id}`} className="hover:text-orange-600">
                        {q.customer.firstName} {q.customer.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(q.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[q.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {q.validUntil ? formatDate(q.validUntil) : "–"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(q.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
