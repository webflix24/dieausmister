import Header from "@/components/layout/Header";
import CustomerForm from "@/components/customers/CustomerForm";

export default function NewCustomerPage() {
  return (
    <>
      <Header title="Neuer Kunde" />
      <main className="flex-1 p-6 max-w-2xl">
        <CustomerForm />
      </main>
    </>
  );
}
