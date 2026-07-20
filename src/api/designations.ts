import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  CreateDesignationRequest,
  DesignationResponse,
  UpdateDesignationRequest,
} from "../types/designation";

export async function listDesignations(): Promise<DesignationResponse[]> {
  const response = await axiosClient.get<ApiResponse<DesignationResponse[]>>("/designations");
  return response.data.data;
}

export async function getDesignation(id: string): Promise<DesignationResponse> {
  const response = await axiosClient.get<ApiResponse<DesignationResponse>>(`/designations/${id}`);
  return response.data.data;
}

export async function createDesignation(
  dto: CreateDesignationRequest,
): Promise<DesignationResponse> {
  const response = await axiosClient.post<ApiResponse<DesignationResponse>>("/designations", dto);
  return response.data.data;
}

export async function updateDesignation(
  id: string,
  dto: UpdateDesignationRequest,
): Promise<DesignationResponse> {
  const response = await axiosClient.put<ApiResponse<DesignationResponse>>(
    `/designations/${id}`,
    dto,
  );
  return response.data.data;
}

export async function deleteDesignation(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/designations/${id}`);
}
