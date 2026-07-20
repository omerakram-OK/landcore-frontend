import type { CommissionType } from "./agent";

export type { CommissionType };

export type BookingStatus = "Active" | "Converted" | "Expired" | "Cancelled";

export interface BookingResponse {
  id: string;
  adminId: string;
  plotId: string;
  clientId: string;
  leadId: string | null;
  agentId: string | null;
  commissionType: CommissionType | null;
  commissionValue: number | null;
  tokenAmount: number;
  expiryDate: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  plotId: string;
  clientId: string;
  leadId?: string | null;
  agentId?: string | null;
  tokenAmount: number;
  expiryDate?: string | null;
}

export interface BookingActionRequest {
  notes?: string | null;
}
