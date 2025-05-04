import { NextResponse } from "next/server";
import axios from "axios";

/**
 * YouTube API Direct Test Endpoint
 *
 * This endpoint makes a direct call to the YouTube API
 * It's useful for debugging API key issues
 */
export async function GET() {
  try {
    // API key'i doğrudan process.env'den alıyoruz
    const API_KEY = process.env.YOUTUBE_API_KEY;

    // API key var mı kontrol ediyoruz
    if (!API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "API_KEY is undefined or empty",
          environment: process.env.NODE_ENV,
          has_key: false,
        },
        { status: 500 }
      );
    }

    // YouTube API'ye basit bir istek yapıyoruz
    const url = "https://www.googleapis.com/youtube/v3/search";
    const response = await axios.get(url, {
      params: {
        part: "snippet",
        q: "test",
        type: "channel",
        maxResults: 1,
        key: API_KEY,
      },
    });

    // Başarılı cevabı dönüyoruz (API anahtarının güvenliği için detaylı bilgileri gizliyoruz)
    return NextResponse.json({
      success: true,
      has_key: true,
      api_key_length: API_KEY.length,
      status: response.status,
      data_preview: {
        kind: response.data.kind,
        total_results: response.data.pageInfo?.totalResults || 0,
        has_items: !!response.data.items?.length,
      },
    });
  } catch (error) {
    // Hata durumunda detaylı bilgi dönüyoruz
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        has_key: !!process.env.YOUTUBE_API_KEY,
        api_key_length: process.env.YOUTUBE_API_KEY
          ? process.env.YOUTUBE_API_KEY.length
          : 0,
      },
      { status: error.response?.status || 500 }
    );
  }
}
