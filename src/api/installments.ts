import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { ApprovalRequestResponse } from "../types/approval";
import type {
  ApplyDiscountRequest,
  CreateInstallmentPlanRequest,
  InstallmentPlanResponse,
} from "../types/installment";

export async function listInstallmentPlans(): Promise<InstallmentPlanResponse[]> {
  const response = await axiosClient.get<ApiResponse<InstallmentPlanResponse[]>>("/installments");
  return response.data.data;
}

export async function getInstallmentPlan(id: string): Promise<InstallmentPlanResponse> {
  const response = await axiosClient.get<ApiResponse<InstallmentPlanResponse>>(`/installments/${id}`);
  return response.data.data;
}

export async function getInstallmentPlanByBookingId(
  bookingId: string,
): Promise<InstallmentPlanResponse> {
  const response = await axiosClient.get<ApiResponse<InstallmentPlanResponse>>(
    `/installments/booking/${bookingId}`,
  );
  return response.data.data;
}

export async function createInstallmentPlan(
  dto: CreateInstallmentPlanRequest,
): Promise<InstallmentPlanResponse> {
  const response = await axiosClient.post<ApiResponse<InstallmentPlanResponse>>(
    "/installments",
    dto,
  );
  return response.data.data;
}

export async function applyInstallmentDiscount(
  id: string,
  dto: ApplyDiscountRequest,
): Promise<InstallmentPlanResponse | ApprovalRequestResponse> {
  const response = await axiosClient.put<ApiResponse<InstallmentPlanResponse | ApprovalRequestResponse>>(
    `/installments/${id}/discount`,
    dto,
  );
  return response.data.data;
}
