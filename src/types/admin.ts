export type AdminStatus = "Active" | "Suspended";

export interface AdminResponse {
  id: string;
  societyName: string;
  contactEmail: string;
  status: AdminStatus;
  subscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminRequest {
  societyName: string;
  contactEmail: string;
  initialPassword: string;
}

export interface UpdateAdminRequest {
  societyName: string;
  contactEmail: string;
}
