import { NextResponse } from "next/server";
import { deleteRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * RSS feed delete endpoint
 *
 * Called via DELETE method and expects feedId as a URL parameter.
 */
export async function DELETE(request) {
  try {
    // Session check
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get("feedId");

    if (!feedId) {
      return NextResponse.json(
        { error: "feedId parametresi gereklidir" },
        { status: 400 }
      );
    }

    const { data: feedExists, error: feedCheckError } = await supabase
      .from("feeds")
      .select("id")
      .eq("id", feedId)
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .single();

    if (feedCheckError) {
      // If error is not_found
      if (feedCheckError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Feed not found or you don't have access to this feed" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Error checking RSS feed" },
        { status: 500 }
      );
    }

    if (!feedExists) {
      return NextResponse.json(
        { error: "Feed not found or you don't have access to this feed" },
        { status: 404 }
      );
    }

    await deleteRssFeed(feedId);

    return NextResponse.json({
      success: true,
      message: "RSS feed deleted successfully",
    });
  } catch (error) {
    console.error("RSS feed delete error:", error);

    return NextResponse.json(
      { error: error.message || "Error deleting RSS feed" },
      { status: 500 }
    );
  }
}
