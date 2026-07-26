import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { PlotResponse } from "../types/plot";
import type { InstallmentPlanResponse } from "../types/installment";
import type { PaymentResponse } from "../types/payment";
import type { DocumentResponse } from "../types/document";
import type {
  ClientPortalPlotDetail,
  ClientPortalProfile,
  UpdateClientPortalProfileRequest,
} from "../types/clientPortal";

export async function getMyPlots(): Promise<PlotResponse[]> {
  const response = await axiosClient.get<ApiResponse<PlotResponse[]>>("/client-portal/plots");
  return response.data.data;
}

export async function getMyResalePurchases(): Promise<PlotResponse[]> {
  const response = await axiosClient.get<ApiResponse<PlotResponse[]>>("/client-portal/resale-purchases");
  return response.data.data;
}

export async function getMyInstallmentPlans(): Promise<InstallmentPlanResponse[]> {
  const response = await axiosClient.get<ApiResponse<InstallmentPlanResponse[]>>("/client-portal/installment-plans");
  return response.data.data;
}

export async function getMyPayments(): Promise<PaymentResponse[]> {
  const response = await axiosClient.get<ApiResponse<PaymentResponse[]>>("/client-portal/payments");
  return response.data.data;
}

export async function getMyDocuments(): Promise<DocumentResponse[]> {
  const response = await axiosClient.get<ApiResponse<DocumentResponse[]>>("/client-portal/documents");
  return response.data.data;
}

export async function downloadMyDocument(id: string): Promise<void> {
  const response = await axiosClient.get<Blob>(`/client-portal/documents/${id}/download`, {
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

export async function getMyPlotDetail(plotId: string): Promise<ClientPortalPlotDetail> {
  const response = await axiosClient.get<ApiResponse<ClientPortalPlotDetail>>(`/client-portal/plots/${plotId}`);
  return response.data.data;
}

export async function getMyProfile(): Promise<ClientPortalProfile> {
  const response = await axiosClient.get<ApiResponse<ClientPortalProfile>>("/client-portal/profile");
  return response.data.data;
}

export async function updateMyProfile(dto: UpdateClientPortalProfileRequest): Promise<ClientPortalProfile> {
  const response = await axiosClient.put<ApiResponse<ClientPortalProfile>>("/client-portal/profile", dto);
  return response.data.data;
}

export async function uploadMyPhoto(file: File): Promise<ClientPortalProfile> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<ClientPortalProfile>>("/client-portal/profile/photo", formData);
  return response.data.data;
}

export async function removeMyPhoto(): Promise<ClientPortalProfile> {
  const response = await axiosClient.delete<ApiResponse<ClientPortalProfile>>("/client-portal/profile/photo");
  return response.data.data;
}
