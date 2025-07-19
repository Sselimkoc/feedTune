import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * API to create user database record
 * This API creates a database record for authenticated users if they don't exist
 */
export async function POST() {
  try {
    // Session check
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

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Return error if no session
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    // Error check - if not a "record not found" error
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error during user check:", checkError);
      return NextResponse.json(
        { error: "Error occurred during user check" },
        { status: 500 }
      );
    }

    // If user already exists, return success response
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "User already exists",
        user: { id: existingUser.id },
      });
    }

    // Create new user record
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          email: session.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: "Failed to create user record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Unexpected error in ensure-user API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * API status check
 */
export async function GET() {
  return NextResponse.json({
    status: "available",
    message: "User registration service is running",
  });
}
