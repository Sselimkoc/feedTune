import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request) {
  try {
    console.log("Feed delete API - Using mock data for demonstration");

    // Skip authentication check for demo
    // const cookieStore = cookies();
    // const supabase = createServerClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    //   {
    //     cookies: {
    //       get(name) {
    //         return cookieStore.get(name)?.value;
    //       },
    //       set(name, value, options) {
    //         cookieStore.set({ name, value, ...options });
    //       },
    //       remove(name, options) {
    //         cookieStore.set({ name, value: "", ...options });
    //       },
    //     },
    //   }
    // );
    // const { data: { user }, error: userError } = await supabase.auth.getUser();
    // if (userError || !user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Get feed ID from URL params
    const url = new URL(request.url);
    const feedId = url.searchParams.get("feedId");

    if (!feedId) {
      return NextResponse.json(
        { error: "Feed ID is required" },
        { status: 400 }
      );
    }

    try {
      // Mock feed deletion for demonstration
      console.log(`Mock deleting feed with ID: ${feedId}`);

      return NextResponse.json({
        success: true,
        message: "Feed deleted successfully (mock data)",
      });
    } catch (error) {
      console.error("Unexpected error in delete feed:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Delete feed API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
