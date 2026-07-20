export interface EmployeeResponse {
  id: string;
  adminId: string;
  fullName: string;
  email: string;
  phone: string;
  designationId: string;
  designationName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  fullName: string;
  email: string;
  phone: string;
  initialPassword: string;
  designationId: string;
}

export interface UpdateEmployeeRequest {
  fullName: string;
  email: string;
  phone: string;
  designationId: string;
}
