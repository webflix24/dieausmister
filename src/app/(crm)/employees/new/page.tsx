import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import EmployeeForm from "@/components/employees/EmployeeForm";
import type { SessionUser } from "@/types";

export default async function NewEmployeePage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (user?.role !== "ADMIN") redirect("/employees");

  return (
    <>
      <Header title="Neuer Mitarbeiter" />
      <main className="flex-1 p-6 max-w-md">
        <EmployeeForm />
      </main>
    </>
  );
}
