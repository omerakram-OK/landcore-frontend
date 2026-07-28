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
  portalAccessEnabled: boolean;
  marketplaceViewEnabled: boolean;
  marketplacePublishEnabled: boolean;
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
  enablePortalAccess: boolean;
  password?: string | null;
  enableMarketplaceView: boolean;
  enableMarketplacePublish: boolean;
}

export interface UpdateAgentRequest {
  fullName: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  commissionType: CommissionType;
  commissionValue: number;
  enablePortalAccess: boolean;
  password?: string | null;
  enableMarketplaceView: boolean;
  enableMarketplacePublish: boolean;
}

export type CommissionSourceType = "Booking" | "Resale";

export interface AgentCommissionRecordResponse {
  id: string;
  agentId: string;
  plotId: string;
  plotNumber: string;
  bookingId: string | null;
  sourceType: CommissionSourceType;
  commissionType: CommissionType;
  commissionValue: number;
  amount: number;
  earnedAt: string;
}
