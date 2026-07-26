import type { InstallmentPlanResponse } from "./installment";
import type { PaymentResponse } from "./payment";
import type { DocumentResponse } from "./document";
import type { PlotResponse } from "./plot";

export interface ClientPortalProfile {
  id: string;
  fullName: string;
  cnic: string;
  phones: string[];
  email: string;
  address: string;
  emergencyContact: string;
  photoDataUrl: string | null;
}

export interface UpdateClientPortalProfileRequest {
  phones: string[];
  address: string;
  emergencyContact?: string | null;
}

export interface ClientPortalPlotDetail {
  plot: PlotResponse;
  installmentPlan: InstallmentPlanResponse | null;
  payments: PaymentResponse[];
  documents: DocumentResponse[];
}
