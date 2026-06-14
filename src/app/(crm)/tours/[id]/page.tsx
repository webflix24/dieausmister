import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { formatDate, TOUR_STATUS_LABELS } from "@/lib/utils";
import TourActions from "@/components/tours/TourActions";
import TourForm from "@/components/tours/TourForm";

export default async function TourDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const tour = await prisma.tour.findUnique({
    where: { id },
    include: { customer: true, employees: { include: { user: true } } },
  });

  if (!tour) notFound();

  if (edit === "1") {
    const [customers, employees] = await Promise.all([
      prisma.customer.findMany({ orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
      prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    return (
      <>
        <Header title={`Tour bearbeiten: ${tour.title}`} />
        <main className="flex-1 p-6 max-w-2xl">
          <Link href={`/tours/${id}`} className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
            ← Zurück
          </Link>
          <TourForm
            customers={customers}
            employees={employees}
            tourId={id}
            initialData={{
              title: tour.title,
              date: tour.date.toISOString().split("T")[0],
              startTime: tour.startTime ?? undefined,
              endTime: tour.endTime ?? undefined,
              customerId: tour.customerId ?? undefined,
              address: tour.address ?? undefined,
              city: tour.city ?? undefined,
              notes: tour.notes ?? undefined,
              status: tour.status as "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
              employeeIds: tour.employees.map((te) => te.userId),
            }}
          />
        </main>
      </>
    );
  }

  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-600",
  };

  return (
    <>
      <Header title={tour.title} />
      <main className="flex-1 p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/tours" className="text-sm text-gray-500 hover:text-gray-800">
            ← Alle Touren
          </Link>
          <TourActions tourId={id} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{tour.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${statusColors[tour.status]}`}>
                {TOUR_STATUS_LABELS[tour.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Datum & Zeit</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(tour.date)}</p>
              {tour.startTime && (
                <p className="text-sm text-gray-600">
                  {tour.startTime}{tour.endTime ? ` – ${tour.endTime}` : ""} Uhr
                </p>
              )}
            </div>
            {tour.customer && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Kunde</p>
                <Link href={`/customers/${tour.customer.id}`} className="text-sm font-semibold text-orange-600 hover:underline">
                  {tour.customer.firstName} {tour.customer.lastName}
                </Link>
                {tour.customer.phone && <p className="text-sm text-gray-500">{tour.customer.phone}</p>}
              </div>
            )}
            {(tour.address || tour.city) && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Einsatzort</p>
                {tour.address && <p className="text-sm text-gray-900">{tour.address}</p>}
                {tour.city && <p className="text-sm text-gray-600">{tour.city}</p>}
              </div>
            )}
            {tour.employees.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Team</p>
                <div className="flex flex-wrap gap-1.5">
                  {tour.employees.map((te) => (
                    <span key={te.id} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                      {te.user.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tour.notes && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notizen</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{tour.notes}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
