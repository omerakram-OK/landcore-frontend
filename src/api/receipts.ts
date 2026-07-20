import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { ReceiptResponse } from "../types/receipt";

export async function listReceipts(): Promise<ReceiptResponse[]> {
  const response = await axiosClient.get<ApiResponse<ReceiptResponse[]>>("/receipts");
  return response.data.data;
}

export async function getReceipt(id: string): Promise<ReceiptResponse> {
  const response = await axiosClient.get<ApiResponse<ReceiptResponse>>(`/receipts/${id}`);
  return response.data.data;
}
