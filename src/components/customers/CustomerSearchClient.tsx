"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function CustomerSearchClient({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Name, Telefon, Stadt..."
          className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-72"
        />
      </div>
      <button
        type="submit"
        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
      >
        Suchen
      </button>
    </form>
  );
}
