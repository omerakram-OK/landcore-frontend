import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { PlotResponse } from "../types/plot";
import type { AgentCommissionRecordResponse } from "../types/agent";
import type { AgentPortalProfile, UpdateAgentPortalProfileRequest } from "../types/agentPortal";

export async function getMyAvailablePlots(): Promise<PlotResponse[]> {
  const response = await axiosClient.get<ApiResponse<PlotResponse[]>>("/agent-portal/plots");
  return response.data.data;
}

export async function getMyCommissions(): Promise<AgentCommissionRecordResponse[]> {
  const response = await axiosClient.get<ApiResponse<AgentCommissionRecordResponse[]>>("/agent-portal/commissions");
  return response.data.data;
}

export async function getMyAgentProfile(): Promise<AgentPortalProfile> {
  const response = await axiosClient.get<ApiResponse<AgentPortalProfile>>("/agent-portal/profile");
  return response.data.data;
}

export async function updateMyAgentProfile(dto: UpdateAgentPortalProfileRequest): Promise<AgentPortalProfile> {
  const response = await axiosClient.put<ApiResponse<AgentPortalProfile>>("/agent-portal/profile", dto);
  return response.data.data;
}

export async function uploadMyAgentPhoto(file: File): Promise<AgentPortalProfile> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<AgentPortalProfile>>("/agent-portal/profile/photo", formData);
  return response.data.data;
}

export async function removeMyAgentPhoto(): Promise<AgentPortalProfile> {
  const response = await axiosClient.delete<ApiResponse<AgentPortalProfile>>("/agent-portal/profile/photo");
  return response.data.data;
}
