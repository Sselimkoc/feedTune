import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/api/health",
];

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ["/api/youtube/public-search"];

// Check if a route is public
const isPublicRoute = (pathname) => {
  return (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))
  );
};

// Check if a route is an API route
const isApiRoute = (pathname) => {
  return pathname.startsWith("/api/");
};

export async function middleware(req) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { pathname } = req.nextUrl;

    // Skip auth check for public routes
    if (isPublicRoute(pathname)) {
      return res;
    }

    // Get session with short timeout for API routes
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Auth timeout")),
        isApiRoute(pathname) ? 1000 : 3000
      )
    );

    const {
      data: { session },
    } = await Promise.race([sessionPromise, timeoutPromise]);

    // Handle unauthenticated requests
    if (!session) {
      if (isApiRoute(pathname)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const redirectUrl = new URL("/", req.url);
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);

    // Handle timeout and other errors
    if (isApiRoute(req.nextUrl.pathname)) {
      return NextResponse.json(
        { error: "Auth service unavailable" },
        { status: 503 }
      );
    }

    // Redirect to login with error for non-API routes
    const redirectUrl = new URL("/", req.url);
    redirectUrl.searchParams.set("error", "auth_error");
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
