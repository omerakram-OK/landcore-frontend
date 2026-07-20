export type CommissionType = "Percentage" | "Fixed";

export interface AgentResponse {
  id: string;
  adminId: string;
  fullName: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  commissionType: CommissionType;
  commissionValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRequest {
  fullName: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  commissionType: CommissionType;
  commissionValue: number;
}

export interface UpdateAgentRequest {
  fullName: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  commissionType: CommissionType;
  commissionValue: number;
}
