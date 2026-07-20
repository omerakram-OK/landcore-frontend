import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { ClientResponse, CreateClientRequest, UpdateClientRequest } from "../types/client";

export async function listClients(): Promise<ClientResponse[]> {
  const response = await axiosClient.get<ApiResponse<ClientResponse[]>>("/clients");
  return response.data.data;
}

export async function getClient(id: string): Promise<ClientResponse> {
  const response = await axiosClient.get<ApiResponse<ClientResponse>>(`/clients/${id}`);
  return response.data.data;
}

export async function createClient(dto: CreateClientRequest): Promise<ClientResponse> {
  const response = await axiosClient.post<ApiResponse<ClientResponse>>("/clients", dto);
  return response.data.data;
}

export async function updateClient(id: string, dto: UpdateClientRequest): Promise<ClientResponse> {
  const response = await axiosClient.put<ApiResponse<ClientResponse>>(`/clients/${id}`, dto);
  return response.data.data;
}

export async function deleteClient(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/clients/${id}`);
}
