import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { AdminResponse, CreateAdminRequest, UpdateAdminRequest } from "../types/admin";

export async function listAdmins(): Promise<AdminResponse[]> {
  const response = await axiosClient.get<ApiResponse<AdminResponse[]>>("/admins");
  return response.data.data;
}

export async function getAdmin(id: string): Promise<AdminResponse> {
  const response = await axiosClient.get<ApiResponse<AdminResponse>>(`/admins/${id}`);
  return response.data.data;
}

export async function createAdmin(dto: CreateAdminRequest): Promise<AdminResponse> {
  const response = await axiosClient.post<ApiResponse<AdminResponse>>("/admins", dto);
  return response.data.data;
}

export async function updateAdmin(id: string, dto: UpdateAdminRequest): Promise<AdminResponse> {
  const response = await axiosClient.put<ApiResponse<AdminResponse>>(`/admins/${id}`, dto);
  return response.data.data;
}

export async function suspendAdmin(id: string): Promise<AdminResponse> {
  const response = await axiosClient.post<ApiResponse<AdminResponse>>(`/admins/${id}/suspend`);
  return response.data.data;
}

export async function reactivateAdmin(id: string): Promise<AdminResponse> {
  const response = await axiosClient.post<ApiResponse<AdminResponse>>(`/admins/${id}/reactivate`);
  return response.data.data;
}
