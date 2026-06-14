"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TourStatus } from "@/types";

interface Customer { id: string; firstName: string; lastName: string }
interface Employee { id: string; name: string }

interface Props {
  customers: Customer[];
  employees: Employee[];
  initialCustomerId?: string;
  tourId?: string;
  initialData?: {
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    customerId?: string;
    address?: string;
    city?: string;
    notes?: string;
    status: TourStatus;
    employeeIds: string[];
  };
}

export default function TourForm({ customers, employees, initialCustomerId, tourId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    date: initialData?.date ?? today,
    startTime: initialData?.startTime ?? "",
    endTime: initialData?.endTime ?? "",
    customerId: initialData?.customerId ?? initialCustomerId ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    notes: initialData?.notes ?? "",
    status: (initialData?.status ?? "PLANNED") as TourStatus,
    employeeIds: initialData?.employeeIds ?? [],
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleEmployee(userId: string) {
    setForm((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(userId)
        ? prev.employeeIds.filter((id) => id !== userId)
        : [...prev.employeeIds, userId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date) { setError("Titel und Datum sind Pflichtfelder."); return; }

    setLoading(true);
    setError("");

    const url = tourId ? `/api/tours/${tourId}` : "/api/tours";
    const method = tourId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        customerId: form.customerId || null,
      }),
    });

    setLoading(false);
    if (!res.ok) { setError("Fehler beim Speichern."); return; }
    const data = await res.json();
    router.push(`/tours/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Tourdetails</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titel*</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            placeholder="z.B. Wohnungsauflösung Musterstraße"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum*</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => update("startTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => update("endTime", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="PLANNED">Geplant</option>
              <option value="IN_PROGRESS">In Arbeit</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="CANCELLED">Storniert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kunde</label>
            <select
              value={form.customerId}
              onChange={(e) => update("customerId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Kein Kunde</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Mitarbeiter zuweisen</h2>
        <div className="grid grid-cols-2 gap-2">
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.employeeIds.includes(emp.id)}
                onChange={() => toggleEmployee(emp.id)}
                className="rounded accent-orange-500"
              />
              <span className="text-sm text-gray-800">{emp.name}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Speichern..." : tourId ? "Änderungen speichern" : "Tour erstellen"}
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
