import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd.MM.yyyy", { locale: de });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd.MM.yyyy HH:mm", { locale: de });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ANG-${year}-${random}`;
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Entwurf",
  SENT: "Versendet",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
};

export const TOUR_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Geplant",
  IN_PROGRESS: "In Arbeit",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  EMPLOYEE: "Mitarbeiter",
};
