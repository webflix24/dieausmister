import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Users, FileText, MapPin, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  const [customerCount, quoteCount, tourCount, openQuotes, todayTours, recentCustomers] =
    await Promise.all([
      prisma.customer.count(),
      prisma.quote.count(),
      prisma.tour.count(),
      prisma.quote.findMany({
        where: { status: { in: ["DRAFT", "SENT"] } },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.tour.findMany({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: { customer: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "Kunden gesamt", value: customerCount, icon: Users, color: "bg-blue-500", href: "/customers" },
    { label: "Angebote gesamt", value: quoteCount, icon: FileText, color: "bg-green-500", href: "/quotes" },
    { label: "Touren gesamt", value: tourCount, icon: MapPin, color: "bg-purple-500", href: "/tours" },
    { label: "Offene Angebote", value: openQuotes.length, icon: TrendingUp, color: "bg-orange-500", href: "/quotes?status=open" },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, href }) => (
            <Link key={label} href={href} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`${color} rounded-lg p-3 text-white`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Heutige Touren</h2>
              <Link href="/tours" className="text-sm text-orange-600 hover:underline">Alle ansehen</Link>
            </div>
            {todayTours.length === 0 ? (
              <p className="text-gray-400 text-sm">Keine Touren heute geplant.</p>
            ) : (
              <div className="space-y-3">
                {todayTours.map((tour) => (
                  <Link key={tour.id} href={`/tours/${tour.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium mt-0.5">
                      {tour.startTime ?? "–"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tour.title}</p>
                      {tour.customer && (
                        <p className="text-xs text-gray-500">{tour.customer.firstName} {tour.customer.lastName}</p>
                      )}
                      {tour.city && <p className="text-xs text-gray-400">{tour.city}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Offene Angebote</h2>
              <Link href="/quotes" className="text-sm text-orange-600 hover:underline">Alle ansehen</Link>
            </div>
            {openQuotes.length === 0 ? (
              <p className="text-gray-400 text-sm">Keine offenen Angebote.</p>
            ) : (
              <div className="space-y-3">
                {openQuotes.map((quote) => (
                  <Link key={quote.id} href={`/quotes/${quote.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{quote.quoteNumber}</p>
                      <p className="text-xs text-gray-500">{quote.customer.firstName} {quote.customer.lastName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(quote.totalAmount)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${quote.status === "DRAFT" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600"}`}>
                        {quote.status === "DRAFT" ? "Entwurf" : "Versendet"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Neue Kunden</h2>
            <Link href="/customers" className="text-sm text-orange-600 hover:underline">Alle ansehen</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">Name</th>
                  <th className="text-left py-2 font-medium text-gray-500">Telefon</th>
                  <th className="text-left py-2 font-medium text-gray-500">Stadt</th>
                  <th className="text-left py-2 font-medium text-gray-500">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5">
                      <Link href={`/customers/${c.id}`} className="font-medium text-gray-900 hover:text-orange-600">
                        {c.firstName} {c.lastName}
                      </Link>
                    </td>
                    <td className="py-2.5 text-gray-600">{c.phone ?? "–"}</td>
                    <td className="py-2.5 text-gray-600">{c.city ?? "–"}</td>
                    <td className="py-2.5 text-gray-400">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
