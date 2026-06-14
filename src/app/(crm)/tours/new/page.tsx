import { prisma } from "@/lib/db";
import Header from "@/components/layout/Header";
import TourForm from "@/components/tours/TourForm";

export default async function NewTourPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;

  const [customers, employees] = await Promise.all([
    prisma.customer.findMany({ orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <Header title="Neue Tour" />
      <main className="flex-1 p-6 max-w-2xl">
        <TourForm customers={customers} employees={employees} initialCustomerId={customerId} />
      </main>
    </>
  );
}
