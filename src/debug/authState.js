import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Kullanıcı kimlik doğrulama durumunu kontrol eden debug fonksiyonu
 * @returns {Promise<Object>} Auth durumu hakkında bilgi
 */
export async function checkAuthState() {
  try {
    const supabase = createClientComponentClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      return {
        success: false,
        message: "Oturum bilgisi alınırken hata oluştu",
        error: sessionError.message,
        timestamp: new Date().toISOString(),
      };
    }

    const session = sessionData?.session;

    if (!session) {
      return {
        success: false,
        authenticated: false,
        message: "Oturum bulunamadı. Kullanıcı giriş yapmamış olabilir.",
        timestamp: new Date().toISOString(),
      };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return {
        success: false,
        message: "Kullanıcı bilgisi alınırken hata oluştu",
        error: userError.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      authenticated: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        lastSignInAt: userData.user.last_sign_in_at,
      },
      session: {
        expires: session.expires_at,
        valid: new Date(session.expires_at * 1000) > new Date(),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message:
        "Kimlik doğrulama durumu kontrol edilirken beklenmeyen hata oluştu",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Kullanıcı kimliğini hızlıca almak için yardımcı fonksiyon
 * @returns {Promise<string|null>} Kullanıcı ID veya null
 */
export async function getCurrentUserId() {
  try {
    const supabase = createClientComponentClient();
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch (error) {
    console.error("Kullanıcı ID alınırken hata:", error);
    return null;
  }
}

/**
 * Tarayıcı konsolunda kullanılabilecek debug nesnesi
 */
export const authDebug = {
  checkState: checkAuthState,
  getUserId: getCurrentUserId,
};

// Global nesneye ekleme (sadece tarayıcı ortamında)
if (typeof window !== "undefined") {
  window.authDebug = authDebug;
}
