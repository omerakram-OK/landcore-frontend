import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { DocumentResponse, GenerateDocumentRequest } from "../types/document";

export async function generateDocument(dto: GenerateDocumentRequest): Promise<DocumentResponse> {
  const response = await axiosClient.post<ApiResponse<DocumentResponse>>("/documents/generate", dto);
  return response.data.data;
}

export async function listDocumentsForPlot(plotId: string): Promise<DocumentResponse[]> {
  const response = await axiosClient.get<ApiResponse<DocumentResponse[]>>(`/plots/${plotId}/documents`);
  return response.data.data;
}

export async function downloadDocument(id: string): Promise<void> {
  const response = await axiosClient.get<Blob>(`/documents/${id}/download`, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  const fileNameMatch = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)"?/i);
  const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1]) : `document-${id}.pdf`;

  const objectUrl = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}
