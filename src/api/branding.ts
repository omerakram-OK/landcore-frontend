import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { BrandingResponse } from "../types/branding";

export async function getBranding(): Promise<BrandingResponse> {
  const response = await axiosClient.get<ApiResponse<BrandingResponse>>("/branding/logo");
  return response.data.data;
}

export async function uploadLogo(file: File): Promise<BrandingResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<BrandingResponse>>(
    "/branding/logo",
    formData,
  );
  return response.data.data;
}

export async function removeLogo(): Promise<BrandingResponse> {
  const response = await axiosClient.delete<ApiResponse<BrandingResponse>>("/branding/logo");
  return response.data.data;
}
