import { z } from "zod";

/**
 * Custom HTTP Error class that extends Error with a status code
 */
export class HttpError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }
}

/**
 * Complete error handling for edge functions
 * Returns { message, status } for consistent error responses
 */
export function handleError(
  context: string,
  error: unknown
): { message: string; status: number } {
  console.error(`${context}:`, error);

  // Check for custom HttpError first
  if (error instanceof HttpError) {
    return { message: error.message, status: error.statusCode };
  }

  // Check for Zod validation errors (400)
  if (error instanceof z.ZodError) {
    return { message: error.message, status: 400 };
  }

  // Extract message from error, with fallback for non-Error types
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Internal Server Error";

  return { message, status: 500 };
}
