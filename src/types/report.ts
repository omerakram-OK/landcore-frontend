import type { PaymentModeBreakdown } from "./bankAccount";

export interface PlatformSummaryReport {
  totalAdmins: number;
  totalActiveAdmins: number;
  totalPlots: number;
  totalOverduePlots: number;
  year: number;
  month: number;
  totalPaymentsCollectedThisMonth: number;
}

export interface DailyCollectionReport {
  date: string;
  totalCount: number;
  totalAmount: number;
  byMode: PaymentModeBreakdown[];
}

export interface MonthlyProfitReport {
  year: number;
  month: number;
  paymentCount: number;
  totalCollected: number;
  refundCount: number;
  totalCompanyProfitShareFromRefunds: number;
  netProfit: number;
}

export interface AgingBucket {
  bucket: string;
  count: number;
  outstandingAmount: number;
}

export interface AgingReport {
  buckets: AgingBucket[];
  totalOutstandingCount: number;
  totalOutstandingAmount: number;
}
