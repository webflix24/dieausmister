import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDate, ROLE_LABELS } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import type { SessionUser } from "@/types";
import EmployeeActions from "@/components/employees/EmployeeActions";

export default async function EmployeesPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const isAdmin = user?.role === "ADMIN";

  const employees = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { tours: true } },
    },
  });

  return (
    <>
      <Header title="Mitarbeiterportal" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">{employees.length} Mitarbeiter</p>
          {isAdmin && (
            <Link
              href="/employees/new"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Neuer Mitarbeiter
            </Link>
          )}
        </div>

        {!isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Nur Administratoren können Mitarbeiter verwalten.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-sm">
                      {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 leading-tight">{emp.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${emp.role === "ADMIN" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABELS[emp.role]}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{emp.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{emp._count.tours} Touren zugewiesen</p>
                  <p className="text-xs text-gray-400">Dabei seit: {formatDate(emp.createdAt)}</p>
                </div>
                {isAdmin && emp.id !== session?.user?.id && (
                  <EmployeeActions employeeId={emp.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
