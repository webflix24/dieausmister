"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function EmployeeActions({ employeeId }: { employeeId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Mitarbeiter wirklich löschen?")) return;
    await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-gray-300 hover:text-red-500 transition-colors p-1"
      title="Löschen"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
