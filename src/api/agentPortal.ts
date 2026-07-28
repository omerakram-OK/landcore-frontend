import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { PlotResponse } from "../types/plot";
import type { AgentCommissionRecordResponse } from "../types/agent";
import type { AgentPortalProfile, UpdateAgentPortalProfileRequest } from "../types/agentPortal";
import type {
  MarketplaceConversationResponse,
  MarketplaceListingResponse,
  PublishListingRequest,
  SendMarketplaceMessageRequest,
  StartMarketplaceConversationRequest,
} from "../types/marketplace";

export async function getMyAvailablePlots(): Promise<PlotResponse[]> {
  const response = await axiosClient.get<ApiResponse<PlotResponse[]>>("/agent-portal/plots");
  return response.data.data;
}

export async function getMyCommissions(): Promise<AgentCommissionRecordResponse[]> {
  const response = await axiosClient.get<ApiResponse<AgentCommissionRecordResponse[]>>("/agent-portal/commissions");
  return response.data.data;
}

export async function getMyAgentProfile(): Promise<AgentPortalProfile> {
  const response = await axiosClient.get<ApiResponse<AgentPortalProfile>>("/agent-portal/profile");
  return response.data.data;
}

export async function updateMyAgentProfile(dto: UpdateAgentPortalProfileRequest): Promise<AgentPortalProfile> {
  const response = await axiosClient.put<ApiResponse<AgentPortalProfile>>("/agent-portal/profile", dto);
  return response.data.data;
}

export async function uploadMyAgentPhoto(file: File): Promise<AgentPortalProfile> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<AgentPortalProfile>>("/agent-portal/profile/photo", formData);
  return response.data.data;
}

export async function removeMyAgentPhoto(): Promise<AgentPortalProfile> {
  const response = await axiosClient.delete<ApiResponse<AgentPortalProfile>>("/agent-portal/profile/photo");
  return response.data.data;
}

export async function getMarketplacePublishablePlots(): Promise<PlotResponse[]> {
  const response = await axiosClient.get<ApiResponse<PlotResponse[]>>("/agent-portal/marketplace/publishable-plots");
  return response.data.data;
}

export async function getMarketplaceListings(): Promise<MarketplaceListingResponse[]> {
  const response = await axiosClient.get<ApiResponse<MarketplaceListingResponse[]>>("/agent-portal/marketplace/listings");
  return response.data.data;
}

export async function publishToMarketplace(dto: PublishListingRequest): Promise<MarketplaceListingResponse> {
  const response = await axiosClient.post<ApiResponse<MarketplaceListingResponse>>("/agent-portal/marketplace/listings", dto);
  return response.data.data;
}

export async function unpublishFromMarketplace(id: string): Promise<MarketplaceListingResponse> {
  const response = await axiosClient.delete<ApiResponse<MarketplaceListingResponse>>(`/agent-portal/marketplace/listings/${id}`);
  return response.data.data;
}

export async function startMarketplaceConversation(
  dto: StartMarketplaceConversationRequest,
): Promise<MarketplaceConversationResponse> {
  const response = await axiosClient.post<ApiResponse<MarketplaceConversationResponse>>(
    "/agent-portal/marketplace/conversations",
    dto,
  );
  return response.data.data;
}

export async function sendMyMarketplaceMessage(
  conversationId: string,
  dto: SendMarketplaceMessageRequest,
): Promise<MarketplaceConversationResponse> {
  const response = await axiosClient.post<ApiResponse<MarketplaceConversationResponse>>(
    `/agent-portal/marketplace/conversations/${conversationId}/messages`,
    dto,
  );
  return response.data.data;
}

export async function getMyMarketplaceConversations(): Promise<MarketplaceConversationResponse[]> {
  const response = await axiosClient.get<ApiResponse<MarketplaceConversationResponse[]>>(
    "/agent-portal/marketplace/conversations",
  );
  return response.data.data;
}

export async function uploadMarketplaceListingPhoto(listingId: string, file: File): Promise<MarketplaceListingResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<MarketplaceListingResponse>>(
    `/agent-portal/marketplace/listings/${listingId}/photos`,
    formData,
  );
  return response.data.data;
}

export async function removeMarketplaceListingPhoto(listingId: string, photoId: string): Promise<MarketplaceListingResponse> {
  const response = await axiosClient.delete<ApiResponse<MarketplaceListingResponse>>(
    `/agent-portal/marketplace/listings/${listingId}/photos/${photoId}`,
  );
  return response.data.data;
}
