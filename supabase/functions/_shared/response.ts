/**
 * Creates a JSON response with the given data and status code
 * @param data - The data to send as JSON
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers to include (optional)
 */
export const jsonResponse = (
  data: object,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
