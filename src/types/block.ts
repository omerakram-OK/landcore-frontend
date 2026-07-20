export interface BlockResponse {
  id: string;
  adminId: string;
  societyId: string;
  name: string;
  description: string;
  totalPlots: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockRequest {
  societyId: string;
  name: string;
  description: string;
  totalPlots: number;
}

export interface UpdateBlockRequest {
  societyId: string;
  name: string;
  description: string;
  totalPlots: number;
}

export interface BulkImportBlockRowResult {
  rowNumber: number;
  name: string;
  success: boolean;
  error: string | null;
}

export interface BulkImportBlocksResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  rows: BulkImportBlockRowResult[];
}
