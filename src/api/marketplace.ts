import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { PlotResponse } from "../types/plot";
import type {
  MarketplaceConversationResponse,
  MarketplaceListingResponse,
  PublishListingRequest,
  SendMarketplaceMessageRequest,
} from "../types/marketplace";

export async function getPublishablePlots(): Promise<PlotResponse[]> {
  const response = await axiosClient.get<ApiResponse<PlotResponse[]>>("/marketplace/publishable-plots");
  return response.data.data;
}

export async function listMarketplaceListings(): Promise<MarketplaceListingResponse[]> {
  const response = await axiosClient.get<ApiResponse<MarketplaceListingResponse[]>>("/marketplace/listings");
  return response.data.data;
}

export async function publishMarketplaceListing(dto: PublishListingRequest): Promise<MarketplaceListingResponse> {
  const response = await axiosClient.post<ApiResponse<MarketplaceListingResponse>>("/marketplace/listings", dto);
  return response.data.data;
}

export async function unpublishMarketplaceListing(id: string): Promise<MarketplaceListingResponse> {
  const response = await axiosClient.delete<ApiResponse<MarketplaceListingResponse>>(`/marketplace/listings/${id}`);
  return response.data.data;
}

export async function listMarketplaceConversations(): Promise<MarketplaceConversationResponse[]> {
  const response = await axiosClient.get<ApiResponse<MarketplaceConversationResponse[]>>("/marketplace/conversations");
  return response.data.data;
}

export async function sendMarketplaceMessage(
  conversationId: string,
  dto: SendMarketplaceMessageRequest,
): Promise<MarketplaceConversationResponse> {
  const response = await axiosClient.post<ApiResponse<MarketplaceConversationResponse>>(
    `/marketplace/conversations/${conversationId}/messages`,
    dto,
  );
  return response.data.data;
}

export async function uploadMarketplaceListingPhoto(listingId: string, file: File): Promise<MarketplaceListingResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<MarketplaceListingResponse>>(
    `/marketplace/listings/${listingId}/photos`,
    formData,
  );
  return response.data.data;
}

export async function removeMarketplaceListingPhoto(listingId: string, photoId: string): Promise<MarketplaceListingResponse> {
  const response = await axiosClient.delete<ApiResponse<MarketplaceListingResponse>>(
    `/marketplace/listings/${listingId}/photos/${photoId}`,
  );
  return response.data.data;
}
