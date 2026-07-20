import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  CreateSubscriptionRequest,
  SubscriptionResponse,
  UpdateSubscriptionRequest,
} from "../types/subscription";

export async function listSubscriptions(): Promise<SubscriptionResponse[]> {
  const response = await axiosClient.get<ApiResponse<SubscriptionResponse[]>>("/subscriptions");
  return response.data.data;
}

export async function getSubscription(id: string): Promise<SubscriptionResponse> {
  const response = await axiosClient.get<ApiResponse<SubscriptionResponse>>(`/subscriptions/${id}`);
  return response.data.data;
}

export async function getSubscriptionByAdminId(adminId: string): Promise<SubscriptionResponse> {
  const response = await axiosClient.get<ApiResponse<SubscriptionResponse>>(
    `/subscriptions/by-admin/${adminId}`,
  );
  return response.data.data;
}

export async function createSubscription(
  dto: CreateSubscriptionRequest,
): Promise<SubscriptionResponse> {
  const response = await axiosClient.post<ApiResponse<SubscriptionResponse>>("/subscriptions", dto);
  return response.data.data;
}

export async function updateSubscription(
  id: string,
  dto: UpdateSubscriptionRequest,
): Promise<SubscriptionResponse> {
  const response = await axiosClient.put<ApiResponse<SubscriptionResponse>>(
    `/subscriptions/${id}`,
    dto,
  );
  return response.data.data;
}

export async function activateSubscription(id: string): Promise<SubscriptionResponse> {
  const response = await axiosClient.post<ApiResponse<SubscriptionResponse>>(
    `/subscriptions/${id}/activate`,
  );
  return response.data.data;
}

export async function suspendSubscription(id: string): Promise<SubscriptionResponse> {
  const response = await axiosClient.post<ApiResponse<SubscriptionResponse>>(
    `/subscriptions/${id}/suspend`,
  );
  return response.data.data;
}

export async function reactivateSubscription(id: string): Promise<SubscriptionResponse> {
  const response = await axiosClient.post<ApiResponse<SubscriptionResponse>>(
    `/subscriptions/${id}/reactivate`,
  );
  return response.data.data;
}
