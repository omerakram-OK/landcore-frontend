import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { CreateSocietyRequest, SocietyResponse, UpdateSocietyRequest } from "../types/society";

export async function listSocieties(): Promise<SocietyResponse[]> {
  const response = await axiosClient.get<ApiResponse<SocietyResponse[]>>("/societies");
  return response.data.data;
}

export async function getSociety(id: string): Promise<SocietyResponse> {
  const response = await axiosClient.get<ApiResponse<SocietyResponse>>(`/societies/${id}`);
  return response.data.data;
}

export async function createSociety(dto: CreateSocietyRequest): Promise<SocietyResponse> {
  const response = await axiosClient.post<ApiResponse<SocietyResponse>>("/societies", dto);
  return response.data.data;
}

export async function updateSociety(id: string, dto: UpdateSocietyRequest): Promise<SocietyResponse> {
  const response = await axiosClient.put<ApiResponse<SocietyResponse>>(`/societies/${id}`, dto);
  return response.data.data;
}

export async function deleteSociety(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/societies/${id}`);
}
