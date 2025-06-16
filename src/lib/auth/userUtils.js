/**
 * Helper functions for user management
 * This module abstracts operations related to Supabase auth.
 */

import { supabase } from "@/lib/supabase";

/**
 * Checks the current session
 * @returns {Promise<Object|null>} Session information or null
 */
export async function checkSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error during session check:", error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error("Error during session check:", error);
    return null;
  }
}

/**
 * Returns the ID of the logged-in user
 * @returns {Promise<string|null>} User ID or null
 */
export async function getCurrentUserId() {
  try {
    const session = await checkSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Could not get user ID:", error);
    return null;
  }
}

/**
 * Listens for changes in session state
 * @param {Function} callback Function to be called when auth state changes
 * @returns {Function} Function to unsubscribe
 */
export function subscribeToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  }).data.subscription;
}

/**
 * Sign in operation
 * @param {string} email User email address
 * @param {string} password User password
 * @returns {Promise<Object>} Session information or error
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error during sign in:", error);
    return { success: false, error: error.message || "Sign in failed" };
  }
}

/**
 * Sign out operation
 * @returns {Promise<Object>} Operation result
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error during sign out:", error);
    return { success: false, error: error.message || "Sign out failed" };
  }
}

/**
 * Create new user registration
 * @param {string} email User email address
 * @param {string} password User password
 * @returns {Promise<Object>} Registration result
 */
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error during registration:", error);
    return { success: false, error: error.message || "Registration failed" };
  }
}
