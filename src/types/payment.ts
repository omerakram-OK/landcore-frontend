export type PaymentMode = "Cash" | "Bank" | "Cheque";

export interface PaymentResponse {
  id: string;
  adminId: string;
  installmentPlanId: string;
  installmentSeqNo: number;
  amount: number;
  mode: PaymentMode;
  bankAccountId: string | null;
  date: string;
  receiptId: string;
  receiptNumber: string | null;
  creditBalanceApplied: number | null;
  createdAt: string;
}

export interface RecordPaymentRequest {
  installmentPlanId: string;
  installmentSeqNo: number;
  amount: number;
  mode: PaymentMode;
  bankAccountId?: string | null;
  date: string;
  chequeNumber?: string | null;
  chequeBank?: string | null;
  chequeDueDate?: string | null;
  chequeDepositDate?: string | null;
}
