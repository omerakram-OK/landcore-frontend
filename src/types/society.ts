export interface SocietyResponse {
  id: string;
  adminId: string;
  name: string;
  address: string;
  description: string;
  totalPlots: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocietyRequest {
  name: string;
  address: string;
  description: string;
  totalPlots: number;
}

export interface UpdateSocietyRequest {
  name: string;
  address: string;
  description: string;
  totalPlots: number;
}
