export interface ClientResponse {
  id: string;
  adminId: string;
  fullName: string;
  cnic: string;
  phones: string[];
  email: string;
  address: string;
  emergencyContact: string;
  linkedAgentId: string | null;
  coOwnerClientIds: string[];
  portalAccessEnabled: boolean;
  marketplaceViewEnabled: boolean;
  marketplacePublishEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  fullName: string;
  cnic: string;
  phones: string[];
  email: string;
  address: string;
  emergencyContact?: string | null;
  linkedAgentId?: string | null;
  coOwnerClientIds?: string[] | null;
  enablePortalAccess: boolean;
  password?: string | null;
  enableMarketplaceView: boolean;
  enableMarketplacePublish: boolean;
}

export interface UpdateClientRequest {
  fullName: string;
  cnic: string;
  phones: string[];
  email: string;
  address: string;
  emergencyContact?: string | null;
  linkedAgentId?: string | null;
  coOwnerClientIds?: string[] | null;
  enablePortalAccess: boolean;
  password?: string | null;
  enableMarketplaceView: boolean;
  enableMarketplacePublish: boolean;
}
