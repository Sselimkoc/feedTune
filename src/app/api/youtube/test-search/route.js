import { NextResponse } from "next/server";

/**
 * YouTube kanal arama API endpoint'ini test etmek için yardımcı fonksiyon
 */
export async function GET(request) {
  console.log("YouTube kanal arama API test başlatılıyor...");

  // Test sonuçları
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  // Test edilecek arama sorgusu
  const searchQuery = "Google";

  // Test her endpoint'i
  try {
    // YouTube kanal arama API'sini test et
    console.log("Test: YouTube channel-search API...");
    const result = await testEndpoint("/api/youtube/channel-search", {
      query: searchQuery,
    });

    // Sonuçları ekle
    results.tests.push({
      endpoint: "/api/youtube/channel-search",
      success: result.success,
      status: result.status,
      hasChannels:
        Array.isArray(result.data?.channels) && result.data.channels.length > 0,
      hasChannel: !!result.data?.channel,
      channelCount: result.data?.channels?.length || 0,
      error: result.error,
    });

    // Farklı parametre tipleriyle test et
    console.log("Test: YouTube channel-search API with keyword parameter...");
    const keywordResult = await testEndpoint("/api/youtube/channel-search", {
      keyword: searchQuery,
    });

    results.tests.push({
      endpoint: "/api/youtube/channel-search (keyword)",
      success: keywordResult.success,
      status: keywordResult.status,
      hasChannels:
        Array.isArray(keywordResult.data?.channels) &&
        keywordResult.data.channels.length > 0,
      channelCount: keywordResult.data?.channels?.length || 0,
      error: keywordResult.error,
    });

    // Sonuçları döndür
    return NextResponse.json(results);
  } catch (error) {
    console.error("Test sırasında genel hata:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test sırasında genel bir hata oluştu: " + error.message,
        results,
      },
      { status: 500 }
    );
  }
}

/**
 * Belirtilen endpoint'i test etmek için yardımcı fonksiyon
 * @param {string} endpoint - Test edilecek API endpoint yolu
 * @param {object} body - İstek gövdesi
 * @returns {Promise<object>} - Test sonucu
 */
async function testEndpoint(endpoint, body) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}${endpoint}`;

    console.log(`Test: ${url} - Body:`, body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
      error: null,
    };
  } catch (error) {
    console.error(`${endpoint} test hatası:`, error);
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message,
    };
  }
}
