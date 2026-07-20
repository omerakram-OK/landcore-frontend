import { axiosClient } from "./axiosClient";
import type { LoginRequest, LoginResponse } from "../types/auth";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const request: LoginRequest = { email, password };
  const response = await axiosClient.post<LoginResponse>("/auth/login", request);
  return response.data;
}
