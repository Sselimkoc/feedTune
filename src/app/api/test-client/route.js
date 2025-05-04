import { NextResponse } from "next/server";
import { searchChannels } from "@/lib/youtube/api-client";

/**
 * Test the actual API client module
 */
export async function GET() {
  try {
    // Doğrudan api-client.js'deki fonksiyonu çağırıyoruz
    console.log("API Client test başlatılıyor...");

    // searchChannels fonksiyonundan önce API_KEY'in tanımlı olup olmadığını manuel olarak kontrol edelim
    const API_KEY = process.env.YOUTUBE_API_KEY;
    console.log("API Key defined:", !!API_KEY);

    if (API_KEY) {
      console.log("API Key length:", API_KEY.length);
      console.log("API Key first 5 chars:", API_KEY.substring(0, 5));
    }

    // Kanalları arıyoruz
    const results = await searchChannels("test", 1);

    // Sonuçları kontrol ediyoruz
    if (results && results.length > 0) {
      return NextResponse.json({
        success: true,
        message: "API client works!",
        results_count: results.length,
        first_result: results[0],
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "API client returned empty results",
          results: results,
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("API client test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "API client test failed",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
