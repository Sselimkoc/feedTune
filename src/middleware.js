import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/home",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/api/auth/callback",
  "/api/webhooks",
];

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ["/api/youtube/public-search"];

// Check if a route is public
const isPublicRoute = (pathname) => {
  return (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))
  );
};

// Check if a route is an API route
const isApiRoute = (pathname) => {
  return pathname.startsWith("/api/");
};

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Refresh user session securely - required for Server Components
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
