import { getSecureUser } from "@/lib/auth/serverAuth";
import { ApiResponse } from "./response";

/**
 * Wraps a route handler with authentication.
 * Handler receives (request, { user, params }) instead of raw (request, context).
 *
 * Usage:
 *   export const GET = withAuth(async (req, { user }) => { ... })
 *   export const POST = withAuth(async (req, { user, params }) => { ... })
 */
export function withAuth(handler) {
  return async function (request, context) {
    const user = await getSecureUser();
    if (!user) return ApiResponse.unauthorized();
    return handler(request, { ...context, user });
  };
}
