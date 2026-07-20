import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  ApproveApprovalRequest,
  ApprovalRequestResponse,
  ProposeApprovalRequest,
  RejectApprovalRequest,
} from "../types/approval";

export async function proposeApproval(
  dto: ProposeApprovalRequest,
): Promise<ApprovalRequestResponse> {
  const response = await axiosClient.post<ApiResponse<ApprovalRequestResponse>>("/approvals", dto);
  return response.data.data;
}

export async function listApprovals(): Promise<ApprovalRequestResponse[]> {
  const response = await axiosClient.get<ApiResponse<ApprovalRequestResponse[]>>("/approvals");
  return response.data.data;
}

export async function getApproval(id: string): Promise<ApprovalRequestResponse> {
  const response = await axiosClient.get<ApiResponse<ApprovalRequestResponse>>(`/approvals/${id}`);
  return response.data.data;
}

export async function approveApprovalRequest(
  id: string,
  dto: ApproveApprovalRequest,
): Promise<ApprovalRequestResponse> {
  const response = await axiosClient.put<ApiResponse<ApprovalRequestResponse>>(
    `/approvals/${id}/approve`,
    dto,
  );
  return response.data.data;
}

export async function rejectApprovalRequest(
  id: string,
  dto: RejectApprovalRequest,
): Promise<ApprovalRequestResponse> {
  const response = await axiosClient.put<ApiResponse<ApprovalRequestResponse>>(
    `/approvals/${id}/reject`,
    dto,
  );
  return response.data.data;
}
