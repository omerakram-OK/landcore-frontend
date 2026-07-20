import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  AgingReport,
  DailyCollectionReport,
  MonthlyProfitReport,
  PlatformSummaryReport,
} from "../types/report";

export async function getDailyCollectionReport(date: string): Promise<DailyCollectionReport> {
  const response = await axiosClient.get<ApiResponse<DailyCollectionReport>>(
    "/reports/daily-collection",
    { params: { date } },
  );
  return response.data.data;
}

export async function getMonthlyProfitReport(
  year: number,
  month: number,
): Promise<MonthlyProfitReport> {
  const response = await axiosClient.get<ApiResponse<MonthlyProfitReport>>(
    "/reports/monthly-profit",
    { params: { year, month } },
  );
  return response.data.data;
}

export async function getAgingReport(): Promise<AgingReport> {
  const response = await axiosClient.get<ApiResponse<AgingReport>>("/reports/aging");
  return response.data.data;
}

export async function getPlatformSummary(): Promise<PlatformSummaryReport> {
  const response = await axiosClient.get<ApiResponse<PlatformSummaryReport>>(
    "/reports/platform-summary",
  );
  return response.data.data;
}
