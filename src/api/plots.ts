import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { ApprovalRequestResponse } from "../types/approval";
import type {
  AddOrUpdatePlotChargeRequest,
  BulkImportPlotsResult,
  ChangePlotStatusRequest,
  CreatePlotRequest,
  IssueRefundRequest,
  MarkPlotResaleSoldRequest,
  MergePlotsRequest,
  PlotResponse,
  RecordLatePaymentRequest,
  RefundRecordResponse,
  RepossessionScanResult,
  SetAnnualMaintenanceChargeRequest,
  SplitPlotRequest,
  UpdatePlotPossessionStatusRequest,
  UpdatePlotRequest,
} from "../types/plot";

export async function listPlots(): Promise<PlotResponse[]> {
  const response = await axiosClient.get<ApiResponse<PlotResponse[]>>("/plots");
  return response.data.data;
}

export async function getPlot(id: string): Promise<PlotResponse> {
  const response = await axiosClient.get<ApiResponse<PlotResponse>>(`/plots/${id}`);
  return response.data.data;
}

export async function createPlot(dto: CreatePlotRequest): Promise<PlotResponse> {
  const response = await axiosClient.post<ApiResponse<PlotResponse>>("/plots", dto);
  return response.data.data;
}

export async function bulkImportPlots(file: File): Promise<BulkImportPlotsResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<BulkImportPlotsResult>>(
    "/plots/import",
    formData,
  );
  return response.data.data;
}

export async function updatePlot(id: string, dto: UpdatePlotRequest): Promise<PlotResponse> {
  const response = await axiosClient.put<ApiResponse<PlotResponse>>(`/plots/${id}`, dto);
  return response.data.data;
}

export async function deletePlot(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/plots/${id}`);
}

export async function addOrUpdatePlotCharge(
  id: string,
  dto: AddOrUpdatePlotChargeRequest,
): Promise<PlotResponse> {
  const response = await axiosClient.post<ApiResponse<PlotResponse>>(`/plots/${id}/charges`, dto);
  return response.data.data;
}

export async function removePlotCharge(id: string, chargeType: string): Promise<PlotResponse> {
  const response = await axiosClient.delete<ApiResponse<PlotResponse>>(
    `/plots/${id}/charges/${encodeURIComponent(chargeType)}`,
  );
  return response.data.data;
}

export async function setPlotAnnualMaintenanceCharge(
  id: string,
  dto: SetAnnualMaintenanceChargeRequest,
): Promise<PlotResponse> {
  const response = await axiosClient.put<ApiResponse<PlotResponse>>(
    `/plots/${id}/maintenance-charge`,
    dto,
  );
  return response.data.data;
}

export async function changePlotStatus(
  id: string,
  dto: ChangePlotStatusRequest,
): Promise<PlotResponse> {
  const response = await axiosClient.put<ApiResponse<PlotResponse>>(`/plots/${id}/status`, dto);
  return response.data.data;
}

export async function updatePlotPossessionStatus(
  id: string,
  dto: UpdatePlotPossessionStatusRequest,
): Promise<PlotResponse> {
  const response = await axiosClient.put<ApiResponse<PlotResponse>>(
    `/plots/${id}/possession-status`,
    dto,
  );
  return response.data.data;
}

export async function markPlotResaleSold(
  id: string,
  dto: MarkPlotResaleSoldRequest,
): Promise<PlotResponse> {
  const response = await axiosClient.put<ApiResponse<PlotResponse>>(`/plots/${id}/resale-sale`, dto);
  return response.data.data;
}

export async function runRepossessionScan(): Promise<RepossessionScanResult> {
  const response = await axiosClient.put<ApiResponse<RepossessionScanResult>>(
    "/plots/repossession-scan",
  );
  return response.data.data;
}

export async function splitPlot(
  id: string,
  dto: SplitPlotRequest,
): Promise<PlotResponse[] | ApprovalRequestResponse> {
  const response = await axiosClient.post<ApiResponse<PlotResponse[] | ApprovalRequestResponse>>(
    `/plots/${id}/split`,
    dto,
  );
  return response.data.data;
}

export async function mergePlots(
  dto: MergePlotsRequest,
): Promise<PlotResponse | ApprovalRequestResponse> {
  const response = await axiosClient.post<ApiResponse<PlotResponse | ApprovalRequestResponse>>(
    "/plots/merge",
    dto,
  );
  return response.data.data;
}

export async function recordLatePayment(
  id: string,
  dto: RecordLatePaymentRequest,
): Promise<RefundRecordResponse> {
  const response = await axiosClient.post<ApiResponse<RefundRecordResponse>>(
    `/plots/${id}/late-payment`,
    dto,
  );
  return response.data.data;
}

export async function listRefunds(): Promise<RefundRecordResponse[]> {
  const response = await axiosClient.get<ApiResponse<RefundRecordResponse[]>>("/plots/refunds");
  return response.data.data;
}

export async function getRefundsByPlotId(id: string): Promise<RefundRecordResponse[]> {
  const response = await axiosClient.get<ApiResponse<RefundRecordResponse[]>>(
    `/plots/${id}/refunds`,
  );
  return response.data.data;
}

export async function getRefundById(refundRecordId: string): Promise<RefundRecordResponse> {
  const response = await axiosClient.get<ApiResponse<RefundRecordResponse>>(
    `/plots/refunds/${refundRecordId}`,
  );
  return response.data.data;
}

export async function issueRefund(
  refundRecordId: string,
  dto: IssueRefundRequest,
): Promise<RefundRecordResponse | ApprovalRequestResponse> {
  const response = await axiosClient.put<ApiResponse<RefundRecordResponse | ApprovalRequestResponse>>(
    `/plots/refunds/${refundRecordId}/issue`,
    dto,
  );
  return response.data.data;
}
