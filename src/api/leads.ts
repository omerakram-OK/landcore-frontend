import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  AppendFollowUpNoteRequest,
  CreateLeadRequest,
  LeadResponse,
  UpdateLeadRequest,
  UpdateLeadStatusRequest,
} from "../types/lead";

export async function listLeads(): Promise<LeadResponse[]> {
  const response = await axiosClient.get<ApiResponse<LeadResponse[]>>("/leads");
  return response.data.data;
}

export async function getLead(id: string): Promise<LeadResponse> {
  const response = await axiosClient.get<ApiResponse<LeadResponse>>(`/leads/${id}`);
  return response.data.data;
}

export async function createLead(dto: CreateLeadRequest): Promise<LeadResponse> {
  const response = await axiosClient.post<ApiResponse<LeadResponse>>("/leads", dto);
  return response.data.data;
}

export async function updateLead(id: string, dto: UpdateLeadRequest): Promise<LeadResponse> {
  const response = await axiosClient.put<ApiResponse<LeadResponse>>(`/leads/${id}`, dto);
  return response.data.data;
}

export async function updateLeadStatus(
  id: string,
  dto: UpdateLeadStatusRequest,
): Promise<LeadResponse> {
  const response = await axiosClient.patch<ApiResponse<LeadResponse>>(`/leads/${id}/status`, dto);
  return response.data.data;
}

export async function appendLeadFollowUpNote(
  id: string,
  dto: AppendFollowUpNoteRequest,
): Promise<LeadResponse> {
  const response = await axiosClient.post<ApiResponse<LeadResponse>>(
    `/leads/${id}/follow-up-notes`,
    dto,
  );
  return response.data.data;
}

export async function deleteLead(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/leads/${id}`);
}
