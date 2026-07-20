import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { BounceChequeRequest, ChequeResponse } from "../types/cheque";

export async function listCheques(): Promise<ChequeResponse[]> {
  const response = await axiosClient.get<ApiResponse<ChequeResponse[]>>("/cheques");
  return response.data.data;
}

export async function getCheque(id: string): Promise<ChequeResponse> {
  const response = await axiosClient.get<ApiResponse<ChequeResponse>>(`/cheques/${id}`);
  return response.data.data;
}

export async function clearCheque(id: string): Promise<ChequeResponse> {
  const response = await axiosClient.put<ApiResponse<ChequeResponse>>(`/cheques/${id}/clear`);
  return response.data.data;
}

export async function bounceCheque(
  id: string,
  dto: BounceChequeRequest,
): Promise<ChequeResponse> {
  const response = await axiosClient.put<ApiResponse<ChequeResponse>>(`/cheques/${id}/bounce`, dto);
  return response.data.data;
}
