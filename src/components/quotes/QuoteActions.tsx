"use client";

import { useRouter } from "next/navigation";
import { Pencil, Printer, Trash2 } from "lucide-react";

export default function QuoteActions({ quoteId }: { quoteId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Angebot wirklich löschen?")) return;
    await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    router.push("/quotes");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => router.push(`/quotes/${quoteId}?edit=1`)}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Bearbeiten
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Printer className="w-4 h-4" />
        Drucken
      </button>
      <button
        onClick={handleDelete}
        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Löschen
      </button>
    </div>
  );
}
