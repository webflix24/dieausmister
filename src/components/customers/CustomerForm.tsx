"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CustomerFormData } from "@/types";

interface Props {
  initialData?: Partial<CustomerFormData>;
  customerId?: string;
}

export default function CustomerForm({ initialData, customerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<CustomerFormData>({
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    postalCode: initialData?.postalCode ?? "",
    notes: initialData?.notes ?? "",
  });

  function update(field: keyof CustomerFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = customerId ? `/api/customers/${customerId}` : "/api/customers";
    const method = customerId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Fehler beim Speichern. Bitte erneut versuchen.");
      return;
    }

    const data = await res.json();
    router.push(`/customers/${data.id}`);
    router.refresh();
  }

  const fields: { key: keyof CustomerFormData; label: string; type?: string; full?: boolean }[] = [
    { key: "firstName", label: "Vorname*" },
    { key: "lastName", label: "Nachname*" },
    { key: "phone", label: "Telefon", type: "tel" },
    { key: "email", label: "E-Mail", type: "email" },
    { key: "address", label: "Adresse", full: true },
    { key: "postalCode", label: "PLZ" },
    { key: "city", label: "Stadt" },
    { key: "notes", label: "Notizen", full: true },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(({ key, label, type, full }) => (
          <div key={key} className={full ? "col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {key === "notes" ? (
              <textarea
                value={form[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            ) : (
              <input
                type={type ?? "text"}
                value={form[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
                required={key === "firstName" || key === "lastName"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Speichern..." : customerId ? "Änderungen speichern" : "Kunde anlegen"}
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
