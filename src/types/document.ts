export type DocumentType = "AllotmentLetter" | "TransferLetter" | "NOC" | "PossessionLetter";

export interface GenerateDocumentRequest {
  plotId: string;
  documentType: DocumentType;
}

export interface DocumentResponse {
  id: string;
  adminId: string;
  plotId: string;
  clientId: string;
  bookingId: string | null;
  documentType: DocumentType;
  generatedAt: string;
  generatedBy: string;
  createdAt: string;
}
