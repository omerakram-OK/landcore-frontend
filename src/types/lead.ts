export type LeadSource = "WalkIn" | "Referral" | "Agent" | "Call";

export type LeadStatus = "New" | "Contacted" | "FollowUp" | "Converted" | "Lost";

export interface FollowUpNote {
  note: string;
  by: string;
  at: string;
}

export interface LeadResponse {
  id: string;
  adminId: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  interestedPlotId: string | null;
  status: LeadStatus;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  followUpNotes: FollowUpNote[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  interestedPlotId?: string | null;
  assignedEmployeeId: string;
}

export interface UpdateLeadRequest {
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  interestedPlotId?: string | null;
  assignedEmployeeId: string;
}

export interface UpdateLeadStatusRequest {
  status: LeadStatus;
}

export interface AppendFollowUpNoteRequest {
  note: string;
}
