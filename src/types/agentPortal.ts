export interface AgentPortalProfile {
  id: string;
  fullName: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  commissionType: "Percentage" | "Fixed";
  commissionValue: number;
  photoUrl: string | null;
}

export interface UpdateAgentPortalProfileRequest {
  phone: string;
  address: string;
}
