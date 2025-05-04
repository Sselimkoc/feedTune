import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // check if url starts with http and redirect to https
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith("/http")) {
    return NextResponse.redirect(url.pathname.slice(1));
  }

  // Protected routes
  const protectedRoutes = ["/settings", "/feeds", "/favorites", "/read-later"];
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(`${route}/`)
  );

  // Eğer kullanıcı oturumu varsa, user tablosunda kaydının olduğundan emin ol
  if (session?.user) {
    try {
      // Kullanıcının users tablosunda var olup olmadığını kontrol et
      const { data: dbUser, error: dbUserError } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (dbUserError && dbUserError.code !== "PGRST116") {
        console.error("Kullanıcı kontrolü sırasında hata:", dbUserError);
      }

      // Kullanıcı veritabanında yoksa ekle
      if (!dbUser) {
        console.log(
          "Kullanıcı veritabanında bulunamadı, otomatik kayıt yapılıyor:",
          session.user.id
        );

        const { error: insertError } = await supabase.from("users").insert({
          id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Kullanıcı veritabanına eklenirken hata:", insertError);
        } else {
          console.log(
            "Kullanıcı veritabanına başarıyla eklendi:",
            session.user.id
          );
        }
      }
    } catch (error) {
      console.error("Kullanıcı veritabanı işlemi sırasında hata:", error);
    }
  }

  // Auth check for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    // Debug endpoint'leri için istisna
    if (req.nextUrl.pathname.startsWith("/api/debug-")) {
      console.log("Debug API isteği algılandı, kimlik doğrulama atlanıyor");
      return res;
    }

    // Public API endpoints - authentication is not required
    if (
      req.nextUrl.pathname.startsWith("/api/youtube/public-search") ||
      req.nextUrl.pathname.startsWith("/api/youtube/channel-search") ||
      req.nextUrl.pathname.startsWith("/api/image-proxy") ||
      req.nextUrl.pathname.startsWith("/api/rss-preview")
    ) {
      console.log("Public API isteği algılandı, kimlik doğrulama atlanıyor");
      return res;
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // Redirect to home page if no session and on protected route
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/", req.url);
    redirectUrl.searchParams.set("message", "login_required");
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
