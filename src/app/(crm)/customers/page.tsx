import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import CustomerSearchClient from "@/components/customers/CustomerSearchClient";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { city: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { quotes: true, tours: true } } },
  });

  return (
    <>
      <Header title="Kundenverwaltung" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <CustomerSearchClient initialQ={q} />
          <Link
            href="/customers/new"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Kunde
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Telefon</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Stadt</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Angebote</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Touren</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Erstellt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Keine Kunden gefunden.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-medium text-gray-900 hover:text-orange-600"
                      >
                        {c.firstName} {c.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.phone ?? "–"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email ?? "–"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.city ?? "–"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                        {c._count.quotes}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                        {c._count.tours}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
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
