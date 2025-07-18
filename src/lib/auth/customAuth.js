import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

/**
 * Custom authentication system that bypasses Supabase auth
 * Uses our own users table for authentication
 */

// Generate a UUID for new users
function generateUserId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Custom sign up function
 */
export async function customSignUp(email, password, displayName = null) {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: "Email already exists",
        status: "email_exists",
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate user ID
    const userId = generateUserId();

    // Create user in our users table
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email,
        password_hash: hashedPassword,
        display_name: displayName || email.split("@")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, email, display_name, created_at")
      .single();

    if (insertError) {
      console.error("User creation error:", insertError);
      return {
        success: false,
        error: "Failed to create user",
        status: "creation_failed",
      };
    }

    // Create a simple session object
    const session = {
      user: {
        id: newUser.id,
        email: newUser.email,
        display_name: newUser.display_name,
      },
      access_token: "custom_token_" + Date.now(),
      refresh_token: "custom_refresh_" + Date.now(),
    };

    return {
      success: true,
      data: {
        user: session.user,
        session: session,
      },
      status: "direct_signup",
    };
  } catch (error) {
    console.error("Custom sign up error:", error);
    return {
      success: false,
      error: error.message || "Registration failed",
      status: "error",
    };
  }
}

/**
 * Custom sign in function
 */
export async function customSignIn(email, password) {
  try {
    // Find user by email
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("id, email, password_hash, display_name")
      .eq("email", email)
      .single();

    if (findError || !user) {
      return {
        success: false,
        error: "Invalid email or password",
        status: "invalid_credentials",
      };
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Invalid email or password",
        status: "invalid_credentials",
      };
    }

    // Create session object
    const session = {
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
      access_token: "custom_token_" + Date.now(),
      refresh_token: "custom_refresh_" + Date.now(),
    };

    return {
      success: true,
      data: {
        user: session.user,
        session: session,
      },
    };
  } catch (error) {
    console.error("Custom sign in error:", error);
    return {
      success: false,
      error: error.message || "Login failed",
      status: "error",
    };
  }
}

/**
 * Custom sign out function
 */
export async function customSignOut() {
  // For custom auth, we just return success
  // In a real implementation, you might want to invalidate tokens
  return {
    success: true,
  };
}

/**
 * Check if user exists by email
 */
export async function checkUserExists(email) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return {
      exists: !!user,
      user: user || null,
    };
  } catch (error) {
    console.error("Check user exists error:", error);
    return {
      exists: false,
      user: null,
      error: error.message,
    };
  }
}
