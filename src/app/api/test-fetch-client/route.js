import { NextResponse } from "next/server";
import { searchChannels } from "@/lib/youtube/fetch-client";

/**
 * Test the fetch-based YouTube API client
 */
export async function GET() {
  try {
    console.log("Fetch API client test başlatılıyor...");

    // Kanalları arıyoruz
    const results = await searchChannels("test", 1);

    // Sonuçları kontrol ediyoruz
    if (results && results.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Fetch API client works!",
        results_count: results.length,
        first_result: results[0],
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Fetch API client returned empty results",
          results: results,
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Fetch API client test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Fetch API client test failed",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
