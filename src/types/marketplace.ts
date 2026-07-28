export interface MarketplaceListingPhoto {
  id: string;
  base64: string;
  contentType: string;
  uploadedAt: string;
}

export interface MarketplaceListingResponse {
  id: string;
  adminId: string;
  plotId: string;
  plotNumber: string;
  plotType: string;
  price: number;
  size: number;
  sizeUnit: string;
  category: string;
  publishedBy: string;
  publishedByRole: string;
  publishedByName: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  photos: MarketplaceListingPhoto[];
}

export interface PublishListingRequest {
  plotId: string;
  notes?: string | null;
}

export interface MarketplaceMessage {
  senderId: string;
  senderRole: string;
  senderName: string;
  text: string;
  sentAt: string;
}

export interface MarketplaceConversationResponse {
  id: string;
  adminId: string;
  listingId: string;
  plotId: string;
  plotNumber: string;
  initiatorId: string;
  initiatorRole: string;
  initiatorName: string;
  status: "Open" | "Closed";
  messages: MarketplaceMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface StartMarketplaceConversationRequest {
  listingId: string;
  message?: string | null;
}

export interface SendMarketplaceMessageRequest {
  text: string;
}
