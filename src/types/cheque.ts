export type ChequeStatus = "Pending" | "Cleared" | "Bounced";

export interface ChequeResponse {
  id: string;
  adminId: string;
  paymentId: string;
  chequeNumber: string;
  bank: string;
  amount: number;
  dueDate: string;
  depositDate: string;
  status: ChequeStatus;
  bouncePenaltyAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BounceChequeRequest {
  penaltyAmount: number;
  notes?: string | null;
}
