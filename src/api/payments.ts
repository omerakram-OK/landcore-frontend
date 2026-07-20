import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { PaymentResponse, RecordPaymentRequest } from "../types/payment";

export async function listPayments(): Promise<PaymentResponse[]> {
  const response = await axiosClient.get<ApiResponse<PaymentResponse[]>>("/payments");
  return response.data.data;
}

export async function getPayment(id: string): Promise<PaymentResponse> {
  const response = await axiosClient.get<ApiResponse<PaymentResponse>>(`/payments/${id}`);
  return response.data.data;
}

export async function listPaymentsByInstallmentPlanId(planId: string): Promise<PaymentResponse[]> {
  const response = await axiosClient.get<ApiResponse<PaymentResponse[]>>(
    `/payments/by-plan/${planId}`,
  );
  return response.data.data;
}

export async function recordPayment(dto: RecordPaymentRequest): Promise<PaymentResponse> {
  const response = await axiosClient.post<ApiResponse<PaymentResponse>>("/payments", dto);
  return response.data.data;
}
