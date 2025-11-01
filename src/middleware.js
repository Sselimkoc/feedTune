import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Public routes - no auth required
const PUBLIC_ROUTES = [
  "/",
  "/home",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/api/auth/callback",
];

// Public API routes - no auth required
const PUBLIC_API_ROUTES = ["/api/youtube/public-search"];

/**
 * Check if route is public
 */
function isPublicRoute(pathname) {
  return (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))
  );
}

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
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
            request: { headers: request.headers },
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
            request: { headers: request.headers },
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

  const { pathname } = request.nextUrl;

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Refresh session for protected routes
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // User not authenticated - redirect to home
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Refresh session token
    await supabase.auth.refreshSession();
  } catch (error) {
    // Auth error - redirect to home
    console.debug("[middleware] Auth error:", error?.message);
    return NextResponse.redirect(new URL("/", request.url));
  }

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
