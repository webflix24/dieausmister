import { prisma } from "@/lib/db";
import Header from "@/components/layout/Header";
import QuoteForm from "@/components/quotes/QuoteForm";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;

  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <>
      <Header title="Neues Angebot" />
      <main className="flex-1 p-6 max-w-4xl">
        <QuoteForm customers={customers} initialCustomerId={customerId} />
      </main>
    </>
  );
}
