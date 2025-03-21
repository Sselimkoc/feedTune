import { NextResponse } from "next/server";
import { deleteYoutubeChannel } from "@/lib/youtube-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * YouTube kanal silme endpoint'i
 *
 * DELETE isteği ile gelen feedId parametresi ile kanalı siler
 */
export async function DELETE(request) {
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

    // İstek parametrelerini al
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get("feedId");

    if (!feedId) {
      return NextResponse.json(
        { error: "feedId parametresi gereklidir" },
        { status: 400 }
      );
    }

    // Kullanıcının bu beslemeye sahip olup olmadığını kontrol et
    const { data: feed, error: feedError } = await supabase
      .from("feeds")
      .select("*")
      .eq("id", feedId)
      .eq("user_id", session.user.id)
      .single();

    if (feedError || !feed) {
      return NextResponse.json(
        { error: "Beslemeyi silme yetkiniz yok veya besleme bulunamadı" },
        { status: 403 }
      );
    }

    // YouTube kanalını sil
    const result = await deleteYoutubeChannel(feedId);

    // Başarılı cevabı döndür
    return NextResponse.json({
      success: true,
      message: "YouTube kanalı başarıyla silindi",
      result: result,
    });
  } catch (error) {
    console.error("YouTube kanal silme hatası:", error);

    return NextResponse.json(
      { error: error.message || "YouTube kanalı silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
