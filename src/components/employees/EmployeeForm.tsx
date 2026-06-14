"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/types";

interface Props {
  employeeId?: string;
  initialData?: { name: string; email: string; role: Role };
}

export default function EmployeeForm({ employeeId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialData?.role ?? "EMPLOYEE");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId && !password) { setError("Passwort ist Pflichtfeld."); return; }

    setLoading(true);
    setError("");

    const url = employeeId ? `/api/employees/${employeeId}` : "/api/employees";
    const method = employeeId ? "PUT" : "POST";

    const body: Record<string, string> = { name, email, role };
    if (password) body.password = password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Fehler beim Speichern.");
      return;
    }
    router.push("/employees");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail*</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Passwort{employeeId ? " (leer = unverändert)" : "*"}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!employeeId}
          minLength={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="EMPLOYEE">Mitarbeiter</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Speichern..." : employeeId ? "Änderungen speichern" : "Mitarbeiter anlegen"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
