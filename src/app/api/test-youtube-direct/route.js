import { NextResponse } from "next/server";
import axios from "axios";

/**
 * YouTube API Direct Test with Visible Key
 *
 * WARNING: This endpoint shows the actual API key for debugging purposes
 * REMOVE THIS ENDPOINT after debugging is complete!
 */
export async function GET() {
  try {
    // API anahtarını alıyoruz
    const API_KEY = process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "API_KEY is undefined",
        },
        { status: 500 }
      );
    }

    // Kolay referans için anahtarı ekranda gösteriyoruz (GÜVENLİ DEĞİL - sadece debug amaçlı)
    const firstFiveChars = API_KEY.substring(0, 5);
    const lastFiveChars = API_KEY.substring(API_KEY.length - 5);
    const maskedKey = `${firstFiveChars}...${lastFiveChars}`;

    // Doğrudan axios ile değil, fetch API ile alternatif bir istek yapıyoruz
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=channel&maxResults=1&key=${API_KEY}`;

    // Fetch API ile deneyelim
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "API request failed",
          status: response.status,
          statusText: response.statusText,
          data: data,
          api_key_preview: maskedKey,
          api_key_length: API_KEY.length,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      data_preview: {
        kind: data.kind,
        total_results: data.pageInfo?.totalResults || 0,
        has_items: !!data.items?.length,
      },
      api_key_preview: maskedKey,
      api_key_length: API_KEY.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        api_key_exists: !!process.env.YOUTUBE_API_KEY,
        api_key_length: process.env.YOUTUBE_API_KEY
          ? process.env.YOUTUBE_API_KEY.length
          : 0,
      },
      { status: 500 }
    );
  }
}
