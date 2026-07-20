import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { AgentResponse, CreateAgentRequest, UpdateAgentRequest } from "../types/agent";

export async function listAgents(): Promise<AgentResponse[]> {
  const response = await axiosClient.get<ApiResponse<AgentResponse[]>>("/agents");
  return response.data.data;
}

export async function getAgent(id: string): Promise<AgentResponse> {
  const response = await axiosClient.get<ApiResponse<AgentResponse>>(`/agents/${id}`);
  return response.data.data;
}

export async function createAgent(dto: CreateAgentRequest): Promise<AgentResponse> {
  const response = await axiosClient.post<ApiResponse<AgentResponse>>("/agents", dto);
  return response.data.data;
}

export async function updateAgent(id: string, dto: UpdateAgentRequest): Promise<AgentResponse> {
  const response = await axiosClient.put<ApiResponse<AgentResponse>>(`/agents/${id}`, dto);
  return response.data.data;
}

export async function deleteAgent(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/agents/${id}`);
}
