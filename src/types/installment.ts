export type InstallmentStatus = "Pending" | "PartiallyPaid" | "Paid" | "Late" | "Missed";

export interface InstallmentDto {
  seqNo: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAmount: number;
}

export interface InstallmentPlanResponse {
  id: string;
  adminId: string;
  bookingId: string;
  downPayment: number;
  earlyPaymentDiscount: number | null;
  creditBalance: number;
  installments: InstallmentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstallmentItem {
  dueDate: string;
  amount: number;
}

export interface CreateInstallmentPlanRequest {
  bookingId: string;
  downPayment: number;
  earlyPaymentDiscount?: number | null;
  installments: CreateInstallmentItem[];
}

export interface ApplyDiscountRequest {
  discountAmount: number;
  notes?: string | null;
  justification?: string | null;
}

export interface UpdateInstallmentItem {
  seqNo?: number;
  dueDate: string;
  amount: number;
}

export interface UpdateInstallmentPlanRequest {
  installments: UpdateInstallmentItem[];
}
