export type Role = "ADMIN" | "EMPLOYEE";
export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
export type TourStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
}

export interface QuoteItemFormData {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface QuoteFormData {
  customerId: string;
  status: QuoteStatus;
  items: QuoteItemFormData[];
  notes?: string;
  validUntil?: string;
}

export interface TourFormData {
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
}

export interface EmployeeFormData {
  name: string;
  email: string;
  password?: string;
  role: Role;
}
