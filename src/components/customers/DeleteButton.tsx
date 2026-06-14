"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ customerId }: { customerId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Kunden wirklich löschen? Alle zugehörigen Daten werden entfernt.")) return;
    await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
    router.push("/customers");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Löschen
    </button>
  );
}
