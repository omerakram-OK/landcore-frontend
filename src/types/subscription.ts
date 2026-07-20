export type SubscriptionPlan = "Monthly" | "Yearly";
export type SubscriptionStatus = "Active" | "Overdue" | "Suspended";

export interface SubscriptionResponse {
  id: string;
  adminId: string;
  plan: SubscriptionPlan;
  feeAmount: number;
  startDate: string;
  nextDueDate: string;
  status: SubscriptionStatus;
}

export interface CreateSubscriptionRequest {
  adminId: string;
  plan: SubscriptionPlan;
  feeAmount: number;
  startDate: string;
  nextDueDate: string;
  status?: SubscriptionStatus;
}

export interface UpdateSubscriptionRequest {
  plan: SubscriptionPlan;
  feeAmount: number;
  startDate: string;
  nextDueDate: string;
}
