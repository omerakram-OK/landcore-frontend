export type PlotStatus = "Available" | "Booked" | "Sold" | "Overdue" | "Repossessed";

export type PossessionStatus = "NotHandedOver" | "PossessionGiven";

export type PlotCategory = "Residential" | "Commercial";

export type PlotSizeUnit = "Marla" | "Kanal" | "SqYd";

export const PLOT_STATUS_TRANSITIONS: Record<PlotStatus, PlotStatus[]> = {
  Available: ["Booked"],
  Booked: ["Available", "Sold"],
  Sold: ["Overdue"],
  Overdue: ["Sold", "Repossessed"],
  Repossessed: ["Available"],
};

export interface PlotCharge {
  chargeType: string;
  amount: number;
}

export interface PlotHistoryLogEntry {
  event: string;
  details: string;
  at: string;
  by: string;
}

export type CommissionType = "Percentage" | "Fixed";

export interface ResaleAgentCommission {
  agentId: string;
  type: CommissionType;
  value: number;
  amount: number;
}

export interface ResaleCommissionSummary {
  buyerCommissionType: CommissionType | null;
  buyerCommissionValue: number | null;
  buyerCommissionAmount: number;
  ownerCommissionType: CommissionType | null;
  ownerCommissionValue: number | null;
  ownerCommissionAmount: number;
  totalCommissionAmount: number;
  agentCommissions: ResaleAgentCommission[];
  adminNetCommissionAmount: number;
}

export interface ResaleAgentCommissionRequest {
  agentId: string;
  type: CommissionType;
  value: number;
}

export interface PlotResponse {
  id: string;
  adminId: string;
  plotNumber: string;
  blockId: string;
  societyId: string;
  size: number;
  sizeUnit: PlotSizeUnit;
  category: PlotCategory;
  basePrice: number;
  charges: PlotCharge[];
  annualMaintenanceCharge: number;
  status: PlotStatus;
  possessionStatus: PossessionStatus;
  isResale: boolean;
  ownerAskingPrice: number | null;
  listingPrice: number | null;
  soldPrice: number | null;
  soldDate: string | null;
  buyerClientId: string | null;
  resaleProfit: number | null;
  ownerClientIds: string[];
  historyLog: PlotHistoryLogEntry[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  resaleCommission: ResaleCommissionSummary | null;
  openForAgents: boolean;
  assignedAgentIds: string[];
}

export interface CreatePlotRequest {
  plotNumber: string;
  blockId: string;
  size: number;
  sizeUnit: PlotSizeUnit;
  category: PlotCategory;
  basePrice: number;
  annualMaintenanceCharge: number;
  charges?: PlotCharge[] | null;
  ownerClientIds?: string[] | null;
  isResale: boolean;
  ownerAskingPrice?: number | null;
  listingPrice?: number | null;
  openForAgents: boolean;
  assignedAgentIds?: string[] | null;
}

export interface UpdatePlotRequest {
  plotNumber: string;
  blockId: string;
  size: number;
  sizeUnit: PlotSizeUnit;
  category: PlotCategory;
  basePrice: number;
  ownerClientIds?: string[] | null;
  isResale: boolean;
  ownerAskingPrice?: number | null;
  listingPrice?: number | null;
  openForAgents: boolean;
  assignedAgentIds?: string[] | null;
}

export interface MarkPlotResaleSoldRequest {
  soldPrice: number;
  buyerClientId?: string | null;
  soldDate?: string | null;
  notes?: string | null;
  buyerCommissionType?: CommissionType | null;
  buyerCommissionValue?: number | null;
  ownerCommissionType?: CommissionType | null;
  ownerCommissionValue?: number | null;
  agentCommissions?: ResaleAgentCommissionRequest[] | null;
}

export interface AddOrUpdatePlotChargeRequest {
  chargeType: string;
  amount: number;
}

export interface SetAnnualMaintenanceChargeRequest {
  amount: number;
}

export interface ChangePlotStatusRequest {
  status: PlotStatus;
  notes?: string | null;
}

export interface UpdatePlotPossessionStatusRequest {
  possessionStatus: PossessionStatus;
  notes?: string | null;
}

export interface NewPlotDefinition {
  plotNumber: string;
  blockId?: string | null;
  size: number;
  sizeUnit: PlotSizeUnit;
  category: PlotCategory;
  basePrice: number;
  annualMaintenanceCharge: number;
  charges?: PlotCharge[] | null;
  ownerClientIds?: string[] | null;
}

export interface SplitPlotRequest {
  newPlots: NewPlotDefinition[];
  notes?: string | null;
  justification?: string | null;
}

export interface MergePlotsRequest {
  sourcePlotIds: string[];
  newPlot?: NewPlotDefinition | null;
  notes?: string | null;
  justification?: string | null;
}

export type RefundRecordStatus = "PendingIssuance" | "Issued";

export interface RefundRecordResponse {
  id: string;
  adminId: string;
  plotId: string;
  bookingId: string;
  installmentPlanId: string;
  clientId: string;
  amountPaid: number;
  companyProfitAmount: number;
  clientRefundAmount: number;
  paymentDate: string;
  status: RefundRecordStatus;
  issuedAt: string | null;
  issuedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecordLatePaymentRequest {
  amountPaid: number;
  paymentDate: string;
  notes?: string | null;
}

export interface IssueRefundRequest {
  justification?: string | null;
}

export interface RepossessionScanResult {
  newlyOverduePlotIds: string[];
  autoRepossessedPlotIds: string[];
}

export interface BulkImportPlotRowResult {
  rowNumber: number;
  plotNumber: string;
  success: boolean;
  error: string | null;
}

export interface BulkImportPlotsResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  rows: BulkImportPlotRowResult[];
}
