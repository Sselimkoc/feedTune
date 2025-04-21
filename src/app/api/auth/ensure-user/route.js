import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * Kullanıcının veritabanı kaydını yapan API
 * Bu API, oturum açmış kullanıcıların veritabanında kaydı yoksa oluşturur
 */
export async function POST() {
  try {
    // Oturum kontrolü
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Oturum yoksa hata döndür
    if (!session) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Kullanıcı zaten var mı kontrol et
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    // Hata kontrolü - kayıt bulunamadı hatası değilse
    if (checkError && checkError.code !== "PGRST116") {
      console.error("Kullanıcı kontrolü sırasında hata:", checkError);
      return NextResponse.json(
        { error: "Kullanıcı kontrolü sırasında hata oluştu" },
        { status: 500 }
      );
    }

    // Kullanıcı zaten varsa, başarılı yanıt döndür
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "Kullanıcı zaten mevcut",
        user: { id: existingUser.id },
      });
    }

    // Kullanıcı yoksa, oluştur
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    // Ekleme hatası kontrolü
    if (insertError) {
      console.error("Kullanıcı oluşturma hatası:", insertError);
      return NextResponse.json(
        {
          error: "Kullanıcı oluşturulamadı",
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      message: "Kullanıcı başarıyla oluşturuldu",
      user: newUser,
    });
  } catch (error) {
    console.error("Kullanıcı oluşturma API hatası:", error);
    return NextResponse.json(
      { error: "İşlem sırasında hata oluştu", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * API durumunu kontrol etmek için GET metodu
 */
export async function GET() {
  return NextResponse.json({
    status: "available",
    message: "Kullanıcı kayıt servisi çalışıyor",
  });
}
