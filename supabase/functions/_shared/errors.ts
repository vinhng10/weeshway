/**
 * Extracts a safe error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Internal Server Error";
}

/**
 * Logs an error with context
 */
export function logError(context: string, error: unknown): void {
  console.error(`${context}:`, error);
}

/**
 * Complete error handling for edge functions
 * Returns { message, status } for consistent error responses
 */
export function handleError(
  context: string,
  error: unknown,
  defaultStatus = 500
): { message: string; status: number } {
  logError(context, error);

  const message = getErrorMessage(error);

  // Special case: signature errors are 400
  const status = message.includes("signature") ? 400 : defaultStatus;

  return { message, status };
}
