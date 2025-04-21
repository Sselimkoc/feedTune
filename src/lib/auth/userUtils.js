/**
 * Kullanıcı yönetimi için yardımcı fonksiyonlar
 * Bu modül, Supabase auth ile ilgili işlemleri soyutlar.
 */

import { supabase } from "@/lib/supabase";

/**
 * Mevcut oturumu kontrol eder
 * @returns {Promise<Object|null>} Oturum bilgisi veya null
 */
export async function checkSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Oturum kontrolü sırasında hata:", error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error("Oturum kontrolü sırasında hata:", error);
    return null;
  }
}

/**
 * Oturum açmış kullanıcının ID'sini döndürür
 * @returns {Promise<string|null>} Kullanıcı ID'si veya null
 */
export async function getCurrentUserId() {
  try {
    const session = await checkSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error("Kullanıcı ID'si alınamadı:", error);
    return null;
  }
}

/**
 * Oturum durumundaki değişiklikleri dinler
 * @param {Function} callback Auth durumu değiştiğinde çağrılacak fonksiyon
 * @returns {Function} Aboneliği kaldırmak için kullanılacak fonksiyon
 */
export function subscribeToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  }).data.subscription;
}

/**
 * Oturum açma işlemi
 * @param {string} email Kullanıcı e-posta adresi
 * @param {string} password Kullanıcı şifresi
 * @returns {Promise<Object>} Oturum bilgisi veya hata
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
    console.error("Giriş sırasında hata:", error);
    return { success: false, error: error.message || "Giriş başarısız oldu" };
  }
}

/**
 * Oturum kapatma işlemi
 * @returns {Promise<Object>} İşlem sonucu
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Çıkış sırasında hata:", error);
    return { success: false, error: error.message || "Çıkış başarısız oldu" };
  }
}

/**
 * Yeni kullanıcı kaydı oluşturma
 * @param {string} email Kullanıcı e-posta adresi
 * @param {string} password Kullanıcı şifresi
 * @returns {Promise<Object>} Kayıt sonucu
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
    console.error("Kayıt sırasında hata:", error);
    return { success: false, error: error.message || "Kayıt başarısız oldu" };
  }
}
