"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { QuoteItemFormData, QuoteStatus } from "@/types";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  customers: Customer[];
  initialCustomerId?: string;
  quoteId?: string;
  initialData?: {
    customerId: string;
    status: QuoteStatus;
    notes?: string;
    validUntil?: string;
    items: QuoteItemFormData[];
  };
}

const UNITS = ["Stk.", "Std.", "m²", "m³", "Pausch.", "kg", "to."];

export default function QuoteForm({ customers, initialCustomerId, quoteId, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState(initialData?.customerId ?? initialCustomerId ?? "");
  const [status, setStatus] = useState<QuoteStatus>(initialData?.status ?? "DRAFT");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [validUntil, setValidUntil] = useState(initialData?.validUntil ?? "");
  const [items, setItems] = useState<QuoteItemFormData[]>(
    initialData?.items ?? [{ description: "", quantity: 1, unit: "Std.", unitPrice: 85, total: 85 }]
  );

  function updateItem(index: number, field: keyof QuoteItemFormData, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        item.total = parseFloat((item.quantity * item.unitPrice).toFixed(2));
      }
      if (field === "total") {
        item.total = parseFloat(String(value));
      }
      next[index] = item;
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit: "Std.", unitPrice: 85, total: 85 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((s, i) => s + i.total, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { setError("Bitte einen Kunden auswählen."); return; }
    if (items.length === 0) { setError("Mindestens eine Position hinzufügen."); return; }

    setLoading(true);
    setError("");

    const url = quoteId ? `/api/quotes/${quoteId}` : "/api/quotes";
    const method = quoteId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, status, notes, validUntil: validUntil || null, items }),
    });

    setLoading(false);
    if (!res.ok) { setError("Fehler beim Speichern."); return; }
    const data = await res.json();
    router.push(`/quotes/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Angebotsdetails</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kunde*</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Kunde auswählen...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="DRAFT">Entwurf</option>
              <option value="SENT">Versendet</option>
              <option value="ACCEPTED">Angenommen</option>
              <option value="REJECTED">Abgelehnt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gültig bis</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Positionen</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Position hinzufügen
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left py-2 font-medium text-gray-500 w-1/2">Beschreibung</th>
                <th className="text-left py-2 font-medium text-gray-500 w-20">Menge</th>
                <th className="text-left py-2 font-medium text-gray-500 w-24">Einheit</th>
                <th className="text-left py-2 font-medium text-gray-500 w-28">Einzelpreis</th>
                <th className="text-left py-2 font-medium text-gray-500 w-28">Gesamt</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      required
                      placeholder="Leistungsbeschreibung"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.5"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(i, "unit", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                    >
                      {UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <p className="px-2 py-1.5 text-sm font-medium text-gray-900">{formatCurrency(item.total)}</p>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="py-3 pr-2 text-right font-semibold text-gray-700">Gesamtbetrag:</td>
                <td className="py-3 font-bold text-lg text-gray-900">{formatCurrency(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Speichern..." : quoteId ? "Änderungen speichern" : "Angebot erstellen"}
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
