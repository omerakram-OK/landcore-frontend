import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  BlockResponse,
  BulkImportBlocksResult,
  CreateBlockRequest,
  UpdateBlockRequest,
} from "../types/block";

export async function listBlocks(): Promise<BlockResponse[]> {
  const response = await axiosClient.get<ApiResponse<BlockResponse[]>>("/blocks");
  return response.data.data;
}

export async function getBlock(id: string): Promise<BlockResponse> {
  const response = await axiosClient.get<ApiResponse<BlockResponse>>(`/blocks/${id}`);
  return response.data.data;
}

export async function createBlock(dto: CreateBlockRequest): Promise<BlockResponse> {
  const response = await axiosClient.post<ApiResponse<BlockResponse>>("/blocks", dto);
  return response.data.data;
}

export async function updateBlock(id: string, dto: UpdateBlockRequest): Promise<BlockResponse> {
  const response = await axiosClient.put<ApiResponse<BlockResponse>>(`/blocks/${id}`, dto);
  return response.data.data;
}

export async function deleteBlock(id: string): Promise<void> {
  await axiosClient.delete<ApiResponse<{ deleted: boolean }>>(`/blocks/${id}`);
}

export async function bulkImportBlocks(file: File): Promise<BulkImportBlocksResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosClient.post<ApiResponse<BulkImportBlocksResult>>(
    "/blocks/import",
    formData,
  );
  return response.data.data;
}
