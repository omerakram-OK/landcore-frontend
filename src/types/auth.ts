export interface LoginRequest {
  email: string;
  password: string;
}

export type UserRole = "SuperMan" | "Admin" | "Employee" | "Client" | "Agent";

export interface LoginResponseData {
  token: string;
  role: UserRole;
  expiresAt: string;
}

export interface LoginResponse {
  success: boolean;
  data: LoginResponseData;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const CLAIM_TYPES = {
  sub: "sub",
  nameIdentifier: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  adminId: "adminId",
  clientId: "clientId",
  agentId: "agentId",
  permission: "permission",
  email: "email",
  name: "name",
} as const;

export interface DecodedToken {
  sub: string;
  [CLAIM_TYPES.nameIdentifier]?: string;
  [CLAIM_TYPES.role]: UserRole;
  adminId?: string;
  clientId?: string;
  agentId?: string;
  email?: string;
  name?: string;
  permission?: string | string[];
  exp: number;
  iat?: number;
  nbf?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface AuthClaims {
  userId: string;
  role: UserRole;
  adminId: string | null;
  clientId: string | null;
  agentId: string | null;
  permissions: string[];
  email: string | null;
  name: string | null;
  expiresAt: number;
}
