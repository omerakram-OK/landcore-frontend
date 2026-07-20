import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  BankAccountReconciliationReport,
  BankAccountResponse,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
} from "../types/bankAccount";

export async function listBankAccounts(): Promise<BankAccountResponse[]> {
  const response = await axiosClient.get<ApiResponse<BankAccountResponse[]>>("/bankaccounts");
  return response.data.data;
}

export async function getBankAccount(id: string): Promise<BankAccountResponse> {
  const response = await axiosClient.get<ApiResponse<BankAccountResponse>>(`/bankaccounts/${id}`);
  return response.data.data;
}

export async function createBankAccount(
  dto: CreateBankAccountRequest,
): Promise<BankAccountResponse> {
  const response = await axiosClient.post<ApiResponse<BankAccountResponse>>("/bankaccounts", dto);
  return response.data.data;
}

export async function updateBankAccount(
  id: string,
  dto: UpdateBankAccountRequest,
): Promise<BankAccountResponse> {
  const response = await axiosClient.put<ApiResponse<BankAccountResponse>>(
    `/bankaccounts/${id}`,
    dto,
  );
  return response.data.data;
}

export async function deleteBankAccount(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/bankaccounts/${id}`);
}

export async function getBankAccountReconciliation(
  id: string,
  from: string,
  to: string,
): Promise<BankAccountReconciliationReport> {
  const response = await axiosClient.get<ApiResponse<BankAccountReconciliationReport>>(
    `/bankaccounts/${id}/reconciliation`,
    { params: { from, to } },
  );
  return response.data.data;
}
