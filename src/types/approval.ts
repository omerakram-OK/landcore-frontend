export type ApprovalRequestType = "RepossessionOverride" | "Refund" | "MergeSplit" | "LargeDiscount";

export type ApprovalRequestStatus = "PendingApproval" | "Approved" | "Rejected";

export interface ApprovalRequestResponse {
  id: string;
  adminId: string;
  type: ApprovalRequestType;
  requestedByEmployeeId: string;
  targetPlotId: string | null;
  justification: string;
  status: ApprovalRequestStatus;
  decidedByAdminId: string | null;
  decisionNotes: string | null;
  payloadJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposeApprovalRequest {
  type: ApprovalRequestType;
  targetPlotId?: string | null;
  justification: string;
  payloadJson?: string | null;
}

export interface ApproveApprovalRequest {
  decisionNotes?: string | null;
}

export interface RejectApprovalRequest {
  decisionNotes: string;
}

export function isApprovalRequestResponse(value: unknown): value is ApprovalRequestResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "requestedByEmployeeId" in value &&
    "justification" in value &&
    "status" in value
  );
}
