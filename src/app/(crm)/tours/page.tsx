import { prisma } from "@/lib/db";
import { formatDate, TOUR_STATUS_LABELS } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ToursPage() {
  const now = new Date();
  const tours = await prisma.tour.findMany({
    include: { customer: true, employees: { include: { user: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const upcoming = tours.filter((t) => new Date(t.date) >= new Date(now.setHours(0, 0, 0, 0)));
  const past = tours.filter((t) => new Date(t.date) < new Date(now.setHours(0, 0, 0, 0)));

  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-600",
  };

  function TourCard({ tour }: { tour: typeof tours[0] }) {
    return (
      <Link href={`/tours/${tour.id}`} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow block">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[tour.status]}`}>
                {TOUR_STATUS_LABELS[tour.status]}
              </span>
              {tour.startTime && (
                <span className="text-xs text-gray-500">{tour.startTime}{tour.endTime ? ` – ${tour.endTime}` : ""}</span>
              )}
            </div>
            <p className="font-semibold text-gray-900">{tour.title}</p>
            {tour.customer && (
              <p className="text-sm text-gray-600">{tour.customer.firstName} {tour.customer.lastName}</p>
            )}
            {tour.city && <p className="text-xs text-gray-400">{tour.address ? `${tour.address}, ` : ""}{tour.city}</p>}
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-sm font-medium text-gray-900">{formatDate(tour.date)}</p>
            <div className="flex flex-wrap gap-1 justify-end mt-1">
              {tour.employees.map((te) => (
                <span key={te.id} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  {te.user.name.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
        {tour.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{tour.notes}</p>}
      </Link>
    );
  }

  return (
    <>
      <Header title="Tourenplanung" />
      <main className="flex-1 p-6">
        <div className="flex justify-end mb-5">
          <Link
            href="/tours/new"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Tour
          </Link>
        </div>

        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Kommende Touren ({upcoming.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcoming.map((tour) => <TourCard key={tour.id} tour={tour} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Vergangene Touren ({past.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
                {past.map((tour) => <TourCard key={tour.id} tour={tour} />)}
              </div>
            </section>
          )}
          {tours.length === 0 && (
            <p className="text-center text-gray-400 py-12">Noch keine Touren geplant.</p>
          )}
        </div>
      </main>
    </>
  );
}
