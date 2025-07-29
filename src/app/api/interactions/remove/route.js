import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { itemId, type, itemType } = await request.json();

    if (!itemId || !type || !itemType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validTypes = ["is_read", "is_favorite", "is_read_later"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid interaction type" },
        { status: 400 }
      );
    }

    // Validate item type
    const validItemTypes = ["rss", "youtube"];
    if (!validItemTypes.includes(itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    try {
      // Update interaction to set the type to false
      const { error } = await supabase
        .from("user_interactions")
        .update({ [type]: false })
        .match({ user_id: user.id, item_id: itemId, item_type: itemType });

      if (error) {
        console.error("Error removing interaction:", error);
        return NextResponse.json(
          { error: "Failed to remove interaction" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Unexpected error in remove interaction:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Remove interaction API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
