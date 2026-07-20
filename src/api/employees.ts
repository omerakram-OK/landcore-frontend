import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  CreateEmployeeRequest,
  EmployeeResponse,
  UpdateEmployeeRequest,
} from "../types/employee";

export async function listEmployees(): Promise<EmployeeResponse[]> {
  const response = await axiosClient.get<ApiResponse<EmployeeResponse[]>>("/employees");
  return response.data.data;
}

export async function getEmployee(id: string): Promise<EmployeeResponse> {
  const response = await axiosClient.get<ApiResponse<EmployeeResponse>>(`/employees/${id}`);
  return response.data.data;
}

export async function createEmployee(dto: CreateEmployeeRequest): Promise<EmployeeResponse> {
  const response = await axiosClient.post<ApiResponse<EmployeeResponse>>("/employees", dto);
  return response.data.data;
}

export async function updateEmployee(
  id: string,
  dto: UpdateEmployeeRequest,
): Promise<EmployeeResponse> {
  const response = await axiosClient.put<ApiResponse<EmployeeResponse>>(`/employees/${id}`, dto);
  return response.data.data;
}

export async function deactivateEmployee(id: string): Promise<EmployeeResponse> {
  const response = await axiosClient.delete<ApiResponse<EmployeeResponse>>(`/employees/${id}`);
  return response.data.data;
}
