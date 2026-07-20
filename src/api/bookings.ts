import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  BookingActionRequest,
  BookingResponse,
  CreateBookingRequest,
} from "../types/booking";

export async function listBookings(): Promise<BookingResponse[]> {
  const response = await axiosClient.get<ApiResponse<BookingResponse[]>>("/bookings");
  return response.data.data;
}

export async function getBooking(id: string): Promise<BookingResponse> {
  const response = await axiosClient.get<ApiResponse<BookingResponse>>(`/bookings/${id}`);
  return response.data.data;
}

export async function createBooking(dto: CreateBookingRequest): Promise<BookingResponse> {
  const response = await axiosClient.post<ApiResponse<BookingResponse>>("/bookings", dto);
  return response.data.data;
}

export async function cancelBooking(
  id: string,
  dto: BookingActionRequest,
): Promise<BookingResponse> {
  const response = await axiosClient.put<ApiResponse<BookingResponse>>(
    `/bookings/${id}/cancel`,
    dto,
  );
  return response.data.data;
}

export async function expireBooking(
  id: string,
  dto: BookingActionRequest,
): Promise<BookingResponse> {
  const response = await axiosClient.put<ApiResponse<BookingResponse>>(
    `/bookings/${id}/expire`,
    dto,
  );
  return response.data.data;
}
