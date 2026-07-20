import { AxiosError } from "axios";
import type { ApiErrorResponse } from "../types/auth";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof AxiosError)) {
    return fallback;
  }

  const body = error.response?.data as ApiErrorResponse | undefined;
  if (!body || body.success !== false || !body.error) {
    return fallback;
  }

  const { message, details } = body.error;
  const fieldMessages = formatDetails(details);

  if (fieldMessages.length > 0) {
    return fieldMessages.join(" ");
  }

  return message || fallback;
}

function formatDetails(details: unknown): string[] {
  if (!details || typeof details !== "object") {
    return [];
  }

  const messages: string[] = [];
  for (const [field, value] of Object.entries(details as Record<string, unknown>)) {
    const texts = Array.isArray(value) ? value.map(String) : [String(value)];
    for (const text of texts) {
      messages.push(text.toLowerCase().startsWith(field.toLowerCase()) ? text : `${field}: ${text}`);
    }
  }

  return messages;
}
