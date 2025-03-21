import { NextResponse } from "next/server";
import { addYoutubeChannel } from "@/lib/youtube-service";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * YouTube kanal ekleme endpoint'i
 *
 * POST isteği ile gelen channelId parametresi ile YouTube kanalı ekler.
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

    // İstek gövdesinden channelId'yi al
    const body = await request.json();
    const channelId = body.channelId;

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId parametresi gereklidir" },
        { status: 400 }
      );
    }

    // YouTube kanalını ekle
    const newFeed = await addYoutubeChannel(channelId, session.user.id);

    // Başarılı cevabı döndür
    return NextResponse.json({
      success: true,
      message: "YouTube kanalı başarıyla eklendi",
      feed: newFeed,
    });
  } catch (error) {
    console.error("YouTube kanal ekleme hatası:", error);

    return NextResponse.json(
      { error: error.message || "YouTube kanalı eklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
