import type { PaymentMode } from "./payment";

export interface BankAccountResponse {
  id: string;
  adminId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface UpdateBankAccountRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface PaymentModeBreakdown {
  mode: PaymentMode;
  count: number;
  amount: number;
}

export interface BankAccountReconciliationReport {
  bankAccountId: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  from: string;
  to: string;
  totalPaymentCount: number;
  totalRecordedAmount: number;
  byMode: PaymentModeBreakdown[];
  note: string;
}
