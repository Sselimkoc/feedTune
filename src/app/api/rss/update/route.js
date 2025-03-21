import { NextResponse } from "next/server";
import { updateRssFeed } from "@/lib/rss-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * RSS besleme güncelleme endpoint'i
 *
 * POST metodu ile çağrılır ve body'de feedId parametresi bekler.
 */
export async function POST(request) {
  try {
    // Oturum kontrolü
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

    // Request body'den feedId'yi al
    const { feedId } = await request.json();

    if (!feedId) {
      return NextResponse.json(
        { error: "feedId parametresi gereklidir" },
        { status: 400 }
      );
    }

    // Beslemenin mevcut kullanıcıya ait olup olmadığını kontrol et
    const { data: feedExists, error: feedCheckError } = await supabase
      .from("feeds")
      .select("id")
      .eq("id", feedId)
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .single();

    if (feedCheckError) {
      // Eğer hata not_found ise
      if (feedCheckError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Besleme bulunamadı veya bu beslemeye erişim izniniz yok" },
          { status: 404 }
        );
      }

      console.error("Feed kontrol hatası:", feedCheckError);
      return NextResponse.json(
        { error: "RSS besleme kontrolü sırasında bir hata oluştu" },
        { status: 500 }
      );
    }

    if (!feedExists) {
      return NextResponse.json(
        { error: "Besleme bulunamadı veya bu beslemeye erişim izniniz yok" },
        { status: 404 }
      );
    }

    // RSS beslemesini güncelle
    await updateRssFeed(feedId);

    return NextResponse.json({
      success: true,
      message: "RSS beslemesi başarıyla güncellendi",
    });
  } catch (error) {
    console.error("RSS besleme güncelleme hatası:", error);

    return NextResponse.json(
      {
        error: error.message || "RSS beslemesi güncellenirken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}
